import { Router } from "express";
import {
  addTable,
  getTables,
  updateTable,
  deleteTable,
} from "./controllers/tableController";
import { validateTable } from "../../shared/middleware/validation";

const router = Router();

router.post("/:id/tables", validateTable, addTable);
router.get("/:id/tables", getTables);
router.patch("/:id/tables/:tableId", updateTable);
router.delete("/:id/tables/:tableId", deleteTable);

export default router;
