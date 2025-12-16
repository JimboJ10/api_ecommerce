import models from '../models/index.js'
import resource from '../resources/index.js'

export default {
    list: async(req, res) => {
        try {
            let user_id = req.query.user_id;
            
            if (!user_id) {
                if (!req.user || !req.user.sub) {
                    return res.status(401).json({
                        message: "NO AUTORIZADO - Token inválido"
                    });
                }
                user_id = req.user.sub;
            }
            
            let CARTS = await models.Cart.find({
                user: user_id,
            }).populate("variedad").populate({
                path: "product",
                populate: {
                    path: "categorie"
                },
            });

            CARTS = CARTS.map((cart) => {
                return resource.Cart.cart_list(cart);
            });

            res.status(200).json({
                carts: CARTS,
            })
        } catch (error) {
            console.error('❌ Error al obtener carrito:', error);
            res.status(500).send({
                message: "OCURRIO UN ERROR",
            });
        }
    },

    register:async(req,res) => {
        try {
            let data = req.body;

            if(data.variedad){
                let valid_cart = await models.Cart.findOne({
                    user: data.user,
                    variedad: data.variedad,
                    product: data.product,
                });
                if(valid_cart){
                    return res.status(200).json({
                        message: 403,
                        message_text: "EL PRODUCTO CON LA VARIEDAD YA EXISTE EN EL CARRITO DE COMPRA",
                    });
                }
            }else{
                let valid_cart = await models.Cart.findOne({
                    user: data.user,
                    product: data.product,
                });
                if(valid_cart){
                    return res.status(200).json({
                        message: 403,
                        message_text: "EL PRODUCTO YA EXISTE EN EL CARRITO DE COMPRA",
                    });
                }
            }

            if(data.variedad){
                let valid_variedad = await models.Variedad.findById(data.variedad);
                if(valid_variedad.stock < data.cantidad){
                    return res.status(200).json({
                        message: 403,
                        message_text: "EL STOCK NO ESTA DISPONIBLE"
                    });
                }
            }else{
                let valid_product = await models.Product.findById(data.product);
                if(valid_product.stock < data.cantidad){
                    return res.status(200).json({
                        message: 403,
                        message_text: "EL STOCK NO ESTA DISPONIBLE"
                    });
                }
            }
            
            let CART = await models.Cart.create(data);
            
            let NEW_CART = await models.Cart.findById(CART._id)
                .populate("variedad")
                .populate({
                    path: "product",
                    populate: {
                        path: "categorie"
                    },
                });

            res.status(200).json({
                cart: resource.Cart.cart_list(NEW_CART),
                message_text: "EL CARRITO SE REGISTRO CON EXITO",
            });
        } catch (error) {
            console.error('❌ Error al registrar carrito:', error);
            res.status(500).send({
                message:"OCURRIO UN ERROR",
            });
        }
    },

    update: async(req, res) => {
        try {
            let data = req.body;

            // Buscar el carrito actual
            let cart = await models.Cart.findById(data._id);
            
            if (!cart) {
                return res.status(404).json({
                    message: 403,
                    message_text: "EL CARRITO NO EXISTE"
                });
            }

            // VALIDAR SI EL STOCK ESTA DISPONIBLE
            if (data.variedad) {
                // Inventario múltiple
                let valid_variedad = await models.Variedad.findById(data.variedad);
                
                if (!valid_variedad) {
                    console.error('❌ Variedad no encontrada:', data.variedad);
                    return res.status(404).json({
                        message: 403,
                        message_text: "LA VARIEDAD NO EXISTE"
                    });
                }

                if (valid_variedad.stock < data.cantidad) {
                    return res.status(200).json({
                        message: 403,
                        message_text: "EL STOCK NO ESTA DISPONIBLE"
                    });
                }
            } else {
                // Inventario único
                let valid_product = await models.Product.findById(data.product || cart.product);
                
                if (!valid_product) {
                    console.error('❌ Producto no encontrado:', data.product || cart.product);
                    return res.status(404).json({
                        message: 403,
                        message_text: "EL PRODUCTO NO EXISTE"
                    });
                }

                if (valid_product.stock < data.cantidad) {
                    return res.status(200).json({
                        message: 403,
                        message_text: "EL STOCK NO ESTA DISPONIBLE"
                    });
                }
            }
            
            // Actualizar el carrito
            await models.Cart.findByIdAndUpdate(data._id, data);
            
            let NEW_CART = await models.Cart.findById(data._id)
                .populate("variedad")
                .populate({
                    path: "product",
                    populate: {
                        path: "categorie"
                    },
                });

            res.status(200).json({
                cart: resource.Cart.cart_list(NEW_CART),
                message_text: "EL CARRITO SE ACTUALIZO CON EXITO",
            });
        } catch (error) {
            console.error('❌ Error al actualizar carrito:', error);
            res.status(500).send({
                message: "OCURRIO UN ERROR",
            });
        }
    },

    delete:async(req,res) => {
        try {
            let _id = req.params.id;
            await models.Cart.findByIdAndDelete(_id);

            res.status(200).json({
                message_text: "EL CARRITO SE ELIMINO CORRECTAMENTE",
            });
        } catch (error) {
            console.error('❌ Error al eliminar carrito:', error);
            res.status(500).send({
                message:"OCURRIO UN ERROR",
            });
        }
    },

    applyCupon:async(req,res) => {
        try {
            let data = req.body;
            
            // Validar existencia del cupón
            let CUPON = await models.Cupone.findOne({
                code: data.code,
            });
            
            if(!CUPON){
                return res.status(200).json({
                    message: 403,
                    message_text: "EL CUPON INGRESADO NO EXISTE, DIGITE OTRO NUEVAMENTE"
                });
            }

            // Obtener carritos del usuario
            let carts = await models.Cart.find({user: data.user_id}).populate("product");
            
            let products = CUPON.products.map(p => p._id);
            let categories = CUPON.categories.map(c => c._id);

            // Aplicar cupón
            for (const cart of carts) {
                let discount = 0;
                let type_discount = CUPON.type_discount;

                if(products.length > 0 && products.includes(cart.product._id.toString())){
                    discount = CUPON.discount;
                } else if(categories.length > 0 && categories.includes(cart.product.categorie.toString())){
                    discount = CUPON.discount;
                }

                if(discount > 0){
                    let new_price = type_discount === 1 
                        ? cart.product.price_usd - (cart.product.price_usd * discount / 100)
                        : cart.product.price_usd - discount;

                    await models.Cart.findByIdAndUpdate(cart._id, {
                        code_cupon: CUPON.code,
                        type_discount: type_discount,
                        discount: discount,
                        price_unitario: new_price,
                        total: new_price * cart.cantidad
                    });
                }
            }

            res.status(200).json({
                message: 200,
                message_text: "EL CUPON SE APLICO CORRECTAMENTE",
            });
        } catch (error) {
            console.error('❌ Error al aplicar cupón:', error);
            res.status(500).send({
                message:"OCURRIO UN ERROR",
            }); 
        }
    },
}