import routerx from 'express-promise-router'
import ReviewClientController from '../controllers/ReviewClientController.js'
import auth from '../middlewares/auth.js'
const router = routerx();

router.post("/register", auth.verifyEcommerce, ReviewClientController.register);
router.put("/update", auth.verifyEcommerce, ReviewClientController.update);
router.get("/list", ReviewClientController.list); // 🔴 NUEVO
router.get("/check", auth.verifyEcommerce, ReviewClientController.check); // 🔴 NUEVO

export default router;