/**
* holds servers because of cicular dependency - particularly for socket io which needs to be accessed by server
 */
import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";
import { CreateRedisAdapter } from "./";

export const app = express();
export const httpServer = createServer(app);
const RedisAdapter = await CreateRedisAdapter();
export const io = new Server(httpServer, {
    adapter: RedisAdapter
});