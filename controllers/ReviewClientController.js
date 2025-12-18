import models from "../models/index.js";

export default {
    register: async(req, res) => {
        try {
            let data = req.body;

            // Validar que el usuario haya comprado el producto
            let sale_detail = await models.SaleDetail.findById(data.sale_detail);
            
            if (!sale_detail) {
                return res.status(404).json({
                    message: 403,
                    message_text: "NO SE ENCONTRÓ EL DETALLE DE LA VENTA"
                });
            }

            // Verificar si ya existe una reseña para este sale_detail
            let existing_review = await models.Review.findOne({
                sale_detail: data.sale_detail,
                user: data.user
            });

            if (existing_review) {
                return res.status(200).json({
                    message: 403,
                    message_text: "YA HAS DEJADO UNA RESEÑA PARA ESTE PRODUCTO"
                });
            }

            let review = await models.Review.create(data);

            // Poblar los datos para la respuesta
            review = await models.Review.findById(review._id)
                .populate('user')
                .populate('product');

            res.status(200).json({
                message: 200,
                message_text: "LA RESEÑA HA SIDO REGISTRADA CORRECTAMENTE",
                review: review,
            });
        } catch (error) {
            console.error('❌ Error al registrar reseña:', error);
            res.status(500).send({
                message: "OCURRIÓ UN ERROR",
            });
        }
    },

    update: async(req, res) => {
        try {
            let data = req.body;

            await models.Review.findByIdAndUpdate({_id: data._id}, data);

            let review = await models.Review.findById({_id: data._id})
                .populate('user')
                .populate('product');

            res.status(200).json({
                message: 200,
                message_text: "LA RESEÑA HA SIDO MODIFICADA CORRECTAMENTE",
                review: review
            });
        } catch (error) {
            console.error('❌ Error al actualizar reseña:', error);
            res.status(500).send({
                message: "OCURRIÓ UN ERROR",
            });
        }
    },

    // NUEVO: Listar reseñas de un producto
    list: async(req, res) => {
        try {
            let product_id = req.query.product_id;

            // VALIDAR QUE product_id SEA UN ObjectId VÁLIDO
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(product_id);
            
            if (!isObjectId) {
                console.error('❌ product_id NO es un ObjectId válido:', product_id);
                return res.status(200).json({
                    message: 200,
                    reviews: []
                });
            }

            let reviews = await models.Review.find({product: product_id})
                .populate('user')
                .populate('sale_detail')
                .sort({createdAt: -1});

            res.status(200).json({
                message: 200,
                reviews: reviews
            });
        } catch (error) {
            console.error('❌ Error al listar reseñas:', error);
            res.status(500).send({
                message: "OCURRIÓ UN ERROR",
            });
        }
    },

    // Verificar si el usuario puede dejar reseña
    check: async(req, res) => {
        try {
            let user_id = req.query.user_id;
            let product_id = req.query.product_id;

            // VALIDAR QUE product_id SEA UN ObjectId VÁLIDO
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(product_id);
            
            if (!isObjectId) {
                console.error('❌ product_id NO es un ObjectId válido:', product_id);
                return res.status(400).json({
                    message: 400,
                    message_text: "ID DE PRODUCTO INVÁLIDO",
                    can_review: false
                });
            }

            // Buscar si el usuario compró el producto
            let sale_details = await models.SaleDetail.find({product: product_id})
                .populate({
                    path: 'sale',
                    match: { user: user_id }
                });

            // Filtrar solo los que tienen sale (porque populate puede devolver null)
            sale_details = sale_details.filter(sd => sd.sale !== null);

            if (sale_details.length === 0) {
                return res.status(200).json({
                    message: 403,
                    message_text: "NO HAS COMPRADO ESTE PRODUCTO",
                    can_review: false
                });
            }

            // Verificar si ya dejó reseña
            let existing_review = await models.Review.findOne({
                user: user_id,
                product: product_id
            });

            if (existing_review) {
                return res.status(200).json({
                    message: 200,
                    can_review: false,
                    has_review: true,
                    review: existing_review,
                    sale_detail: sale_details[0]._id
                });
            }

            res.status(200).json({
                message: 200,
                can_review: true,
                has_review: false,
                sale_detail: sale_details[0]._id
            });

        } catch (error) {
            console.error('❌ Error al verificar reseña:', error);
            res.status(500).send({
                message: "OCURRIÓ UN ERROR",
            });
        }
    }
}