import routerx from 'express-promise-router'
import SaleController from '../controllers/SaleController.js'
import auth from '../middlewares/auth.js'
const router = routerx();
// http://localhost:3000/api/users/register

router.post("/register",auth.verifyEcommerce,SaleController.register);
// router.get("/send_email/:id",SaleController.send_email);
router.get("/show/:id",auth.verifyEcommerce,SaleController.show);
export default router;