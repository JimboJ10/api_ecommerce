import routerx from 'express-promise-router'
import productController from '../controllers/ProductController.js'
import variedadController from '../controllers/VariedadController.js'
import auth from '../middlewares/auth.js'
import multer from 'multer'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/product')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const upload = multer({ storage: storage })
const router = routerx();
// http://localhost:3000/api/users/register

router.post("/register",[auth.verifyAdmin, upload.single('portada')],productController.register);

router.post("/register_imagen",[auth.verifyAdmin, upload.single('imagen')],productController.register_imagen);
router.post("/remove_imagen",[auth.verifyAdmin],productController.remove_imagen);

router.put("/update",[auth.verifyAdmin, upload.single('portada')],productController.update);
router.get("/list",auth.verifyAdmin,productController.list);
router.delete("/delete",auth.verifyAdmin,productController.remove);

router.get("/uploads/product/:img",productController.obtener_imagen);

router.get("/show/:id",productController.show);

// VARIEDAD

router.post("/register-variedad",[auth.verifyAdmin],variedadController.register);
router.put("/update-variedad",[auth.verifyAdmin],variedadController.update);
router.delete("/delete-variedad/:id",[auth.verifyAdmin],variedadController.delete);

export default router;