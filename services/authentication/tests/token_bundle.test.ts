/*
*this is to test that the token helpers are working correctly
* going to use fake keys , generated at testing time 
* going to also use a test redis instance 
*/

import { describe, test, assert } from "vitest";
import { TokenBundle, type TokenBundleConfig } from "../src/helpers/token_bundle";
import { generateKeyPairSync } from "node:crypto";
import { GenerateRandomBytes, GetEnvString, GetEnvNumber } from "@services/common/utilities";
import { ConnectToRedis } from '@services/common/config';


describe("TokenBundle Tests", async () => {

    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const refreshTokenKey = (await GenerateRandomBytes(32)).toString("hex");
    const xsrfTokenKey = (await GenerateRandomBytes(32)).toString("hex");

    const testClient = await ConnectToRedis({
        db: GetEnvNumber("TEST_REDIS_DB", 0), // use a different db for testing
        host: GetEnvString("TEST_REDIS_HOST", "localhost"),
        port: GetEnvNumber("TEST_REDIS_PORT", 6379),
        password: GetEnvString("TEST_REDIS_PASSWORD", ""),
        maxRetries: 5
    }, console as any)

    const testConfig: TokenBundleConfig = {
        accessTokenPrivateKey: privateKey.export({ type: "pkcs1", format: "pem" }).toString(),
        accessTokenPublicKey: publicKey.export({ type: "pkcs1", format: "pem" }).toString(),
        xsrfTokenKey: xsrfTokenKey,
        refreshTokenKey: refreshTokenKey,
        audience: "test-audience",
        accessTokenExpiration: 60, // 1 minute for testing
        blocklistClient: testClient
    }

    const testTokenBundle = new TokenBundle(testConfig);

    test("TokenBundle should create a valid token bundle", async () => {
        const userId = "test-user";
        const bundle = await testTokenBundle.CreateBundle(userId);
        assert.exists(bundle.accessToken, "Access token should be generated");
        assert.exists(bundle.refreshToken, "Refresh token should be generated");
        assert.exists(bundle.xsrfToken, "XSRF token should be generated");
        assert.isAbove(bundle.expiry, 0, "Expiry should be greater than 0");
    })

    test("TokenBundle should verify access token correctly", async () => {
        const userId = "test-user";
        const bundle = await testTokenBundle.CreateBundle(userId);
        const [claims, err] = testTokenBundle.VerifyAccessToken(bundle.accessToken);
        assert.isNull(err, "Error should be undefined");
        assert.strictEqual(claims.sub, userId, "User ID in claims should match the original user ID");
    })

    test("TokenBundle should verify refresh token correctly", async () => {
        const userId = "test-user";
        const bundle = await testTokenBundle.CreateBundle(userId);
        const claims = testTokenBundle.VerifyRefreshToken(bundle.refreshToken);
        assert.isNotNull(claims, "Claims should not be null");
        assert.strictEqual(claims?.sub, userId, "User ID in claims should match the original user ID");
    })

    test("TokenBundle should verify xsrf token correctly", async () => {
        const userId = "test-user";
        const bundle = await testTokenBundle.CreateBundle(userId);
        const claims = testTokenBundle.VerifyRefreshToken(bundle.refreshToken);
        assert.isNotNull(claims, "Claims should not be null");
        const isValidXsrf = testTokenBundle.VerifyXsrfToken(bundle.xsrfToken, claims!.jti);
        assert.isTrue(isValidXsrf, "XSRF token should be valid");
    })

    test("TokenBundle should blocklist refresh token correctly", async () => {

        const userId = "test-user";
        const bundle = await testTokenBundle.CreateBundle(userId);
        const claims = testTokenBundle.VerifyRefreshToken(bundle.refreshToken);
        assert.isNotNull(claims, "Claims should not be null");
        await testTokenBundle.BlockToken(claims!.jti, claims!.exp);
        const [newBundle, err] = await testTokenBundle.RefreshTokens(claims!);
        assert.isNotNull(err, "Error should not be null for blocklisted token");
        assert.strictEqual(err?.message, "Token is blocked", "Error message should indicate that the token is blocked");
    })

    test("Invalid Access Token should not be verified", async () => {

        const invalidAccessToken = "invalid.token.value";
        const [claims, err] = testTokenBundle.VerifyAccessToken(invalidAccessToken);
        assert.isNull(claims, "Claims should be null for invalid access token");
        assert.isNotNull(err, "Error should not be null for invalid access token");

    })
    test("Invalid Refresh Token should not be verified", async () => {

        const invalidRefreshToken = "invalid.token.value";
        const claims = testTokenBundle.VerifyRefreshToken(invalidRefreshToken);
        assert.isNull(claims, "Claims should be null for invalid refresh token");

    })
    test("Invalid XSRF Token should not be verified", async () => {

        const invalidXsrfToken = "invalid.token.value";
        const isValidXsrf = testTokenBundle.VerifyXsrfToken(invalidXsrfToken, "test-jti");
        assert.isFalse(isValidXsrf, "XSRF token should be invalid");

    })

    test("Bad Audience in Token Bundle should not be verified", async () => {
        const userId = "test-user";
        const bundle = await testTokenBundle.CreateBundle(userId);
        // create a new TokenBundle instance with a different audience
        const differentAudienceConfig: TokenBundleConfig = {
            ...testConfig,
            audience: "different-audience"
        }
        const differentAudienceTokenBundle = new TokenBundle(differentAudienceConfig);
        const [accessTokenClaims, err] = differentAudienceTokenBundle.VerifyAccessToken(bundle.accessToken);
        assert.isNull(accessTokenClaims, "Claims should be null for access token with bad audience");
        assert.isNotNull(err, "Error should not be null for access token with bad audience");
        const refreshTokenClaims = differentAudienceTokenBundle.VerifyRefreshToken(bundle.refreshToken);
        assert.isNull(refreshTokenClaims, "Claims should be null for refresh token with bad audience");
        const isValidXsrf = differentAudienceTokenBundle.VerifyXsrfToken(bundle.xsrfToken, "test-jti");
        assert.isFalse(isValidXsrf, "XSRF token should be invalid");
    })

    test("Different JTI in XSRF Token should not be verified", async () => {
        const userId = "test-user";
        const bundle = await testTokenBundle.CreateBundle(userId);
        const claims = testTokenBundle.VerifyRefreshToken(bundle.refreshToken);
        assert.isNotNull(claims, "Claims should not be null");
        const isValidXsrf = testTokenBundle.VerifyXsrfToken(bundle.xsrfToken, "different-jti");
        assert.isFalse(isValidXsrf, "XSRF token should be invalid for different JTI");
    })

    test("RefreshTokens should return a new valid token bundle", async () => {
        const userId = "test-user";
        const bundle = testTokenBundle.CreateBundle(userId);
        const claims = testTokenBundle.VerifyRefreshToken(bundle.refreshToken);
        assert.isNotNull(claims, "Claims should not be null");
        const [newBundle, err] = await testTokenBundle.RefreshTokens(claims!);
        assert.isNull(err, "Error should be null for a valid refresh");
        assert.exists(newBundle.accessToken, "New access token should be generated");
        assert.exists(newBundle.refreshToken, "New refresh token should be generated");
        assert.exists(newBundle.xsrfToken, "New XSRF token should be generated");
        assert.isAbove(newBundle.expiry, 0, "Expiry should be greater than 0");
    })

    test("RefreshTokens should return tokens with the correct user id", async () => {
        const userId = "test-user";
        const bundle = testTokenBundle.CreateBundle(userId);
        const claims = testTokenBundle.VerifyRefreshToken(bundle.refreshToken);
        assert.isNotNull(claims, "Claims should not be null");
        const [newBundle, err] = await testTokenBundle.RefreshTokens(claims!);
        assert.isNull(err, "Error should be null for a valid refresh");
        const [newAccessClaims, accessErr] = testTokenBundle.VerifyAccessToken(newBundle.accessToken);
        assert.isNull(accessErr, "Error should be null for a valid access token");
        assert.strictEqual(newAccessClaims!.sub, userId, "User ID in new access token claims should match the original user ID");
        const newRefreshClaims = testTokenBundle.VerifyRefreshToken(newBundle.refreshToken);
        assert.isNotNull(newRefreshClaims, "New refresh token claims should not be null");
        assert.strictEqual(newRefreshClaims!.sub, userId, "User ID in new refresh token claims should match the original user ID");
    })

    test("RefreshTokens should preserve the original expiry", async () => {
        const userId = "test-user";
        const bundle = testTokenBundle.CreateBundle(userId);
        const claims = testTokenBundle.VerifyRefreshToken(bundle.refreshToken);
        assert.isNotNull(claims, "Claims should not be null");
        const [newBundle, err] = await testTokenBundle.RefreshTokens(claims!);
        assert.isNull(err, "Error should be null for a valid refresh");
        assert.strictEqual(newBundle.expiry, claims.exp, "Expiry of new refresh token should match the original refresh token expiry");
    })

    test("RefreshTokens should blocklist the old refresh token", async () => {
        const userId = "test-user";
        const bundle = testTokenBundle.CreateBundle(userId);
        const claims = testTokenBundle.VerifyRefreshToken(bundle.refreshToken);
        assert.isNotNull(claims, "Claims should not be null");
        const [_, err] = await testTokenBundle.RefreshTokens(claims!);
        assert.isNull(err, "Error should be null for a valid refresh");
        // attempt to use the old refresh token again - should be blocked
        const [newBundle, refreshErr] = await testTokenBundle.RefreshTokens(claims!);
        assert.isNull(newBundle, "New bundle should be null for a blocklisted token");
        assert.isNotNull(refreshErr, "Error should not be null for a blocklisted token");
        assert.strictEqual(refreshErr?.message, "Token is blocked", "Error message should indicate that the token is blocked");
    })

    test("RefreshTokens new XSRF token should be tied to the new refresh token", async () => {
        const userId = "test-user";
        const bundle = testTokenBundle.CreateBundle(userId);
        const claims = testTokenBundle.VerifyRefreshToken(bundle.refreshToken);
        assert.isNotNull(claims, "Claims should not be null");
        const [newBundle, err] = await testTokenBundle.RefreshTokens(claims!);
        assert.isNull(err, "Error should be null for a valid refresh");
        const newRefreshClaims = testTokenBundle.VerifyRefreshToken(newBundle!.refreshToken);
        assert.isNotNull(newRefreshClaims, "New refresh token claims should not be null");
        const isValidXsrf = testTokenBundle.VerifyXsrfToken(newBundle!.xsrfToken, newRefreshClaims!.jti);
        assert.isTrue(isValidXsrf, "New XSRF token should be tied to the new refresh token's JTI");
        // old xsrf should not be valid for new refresh token
        const isOldXsrfValid = testTokenBundle.VerifyXsrfToken(bundle.xsrfToken, newRefreshClaims!.jti);
        assert.isFalse(isOldXsrfValid, "Old XSRF token should not be valid for the new refresh token");
    })

})