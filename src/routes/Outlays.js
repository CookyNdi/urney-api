import express from "express";
import { getOutlaysByUserId, createOutlays, updateOutlays, deleteOutlays } from "../controllers/Outlays.js";
import { authentication } from "../middleware/Access.js";

const route = express.Router();

route.get("/api/outlays", authentication, getOutlaysByUserId);
route.post("/api/outlays", authentication, createOutlays);
route.patch("/api/outlays/:id", authentication, updateOutlays);
route.delete("/api/outlays/:id", authentication, deleteOutlays);

export default route;
