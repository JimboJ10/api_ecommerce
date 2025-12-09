import routerx from 'express-promise-router'
import categoriecontroller from '../controllers/CategorieController.js'
import auth from '../middlewares/auth.js'
import multer from 'multer'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/categorie')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const upload = multer({ storage: storage })
const router = routerx();

router.post("/register",[auth.verifyAdmin, upload.single('portada')],categoriecontroller.register);
router.put("/update",[auth.verifyAdmin, upload.single('portada')],categoriecontroller.update);
router.get("/list",auth.verifyAdmin,categoriecontroller.list);
router.delete("/delete",auth.verifyAdmin,categoriecontroller.remove);

router.get("/uploads/categorie/:img",categoriecontroller.obtener_imagen);

export default router;