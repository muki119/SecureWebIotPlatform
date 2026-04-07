/**
* holds servers because of cicular dependency - particularly for socket io which needs to be accessed by server
 */
import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";
import { RedisAdapter } from "./";

export const app = express();
export const httpServer = createServer(app);
export const io = new Server(httpServer, {
    adapter: RedisAdapter
});