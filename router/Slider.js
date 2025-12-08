import routerx from 'express-promise-router'
import sliderController from '../controllers/SliderController.js'
import auth from '../middlewares/auth.js'
import multer from 'multer'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/slider')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const upload = multer({ storage: storage })
const router = routerx();
// http://localhost:3000/api/users/register

router.post("/register",[auth.verifyAdmin, upload.single('imagen')],sliderController.register);
router.put("/update",[auth.verifyAdmin, upload.single('imagen')],sliderController.update);
router.get("/list",auth.verifyAdmin,sliderController.list);
router.delete("/delete",auth.verifyAdmin,sliderController.remove);

router.get("/uploads/slider/:img",sliderController.obtener_imagen);

export default router;