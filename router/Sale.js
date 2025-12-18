import routerx from 'express-promise-router'
import SaleController from '../controllers/SaleController.js'
import auth from '../middlewares/auth.js'
const router = routerx();

router.post("/register", auth.verifyEcommerce, SaleController.register);
router.get("/list", auth.verifyEcommerce, SaleController.list);
router.get("/show/:id", auth.verifyEcommerce, SaleController.show);

router.get("/list-all", auth.verifyAdmin, SaleController.list_all);
router.get("/stats", auth.verifyAdmin, SaleController.stats);

export default router;