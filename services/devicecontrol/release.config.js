import { dockerRelease } from "../../release.config.base.js";

export default dockerRelease({
	image: "ghcr.io/muki119/securewebiotplatform/devicecontrol",
	context: "..",
});
