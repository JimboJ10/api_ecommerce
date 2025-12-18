import routerx from 'express-promise-router'
import AddressClientController from '../controllers/AddressClientController.js'
import auth from '../middlewares/auth.js'
const router = routerx();

router.post("/register",auth.verifyEcommerce,AddressClientController.register);
router.put("/update",auth.verifyEcommerce,AddressClientController.update);
router.get("/list",auth.verifyEcommerce,AddressClientController.list);
router.delete("/delete/:id",auth.verifyEcommerce,AddressClientController.remove);

export default router;