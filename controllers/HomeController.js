import models from '../models/index.js'
import resource from '../resources/index.js'
import bcrypt from 'bcryptjs'

export default {
    list:async(req,res) => {
        try {

            var TIME_NOW  = req.query.TIME_NOW;

            let Sliders = await models.Slider.find({state:1});

            Sliders = Sliders.map((slider) => {
                return resource.Slider.slider_list(slider);
            })

            let Categories = await models.Categorie.find({state:1});

            Categories = Categories.map((categorie) => {
                return resource.Categorie.categorie_list(categorie);
            })
            
            let CampaingDiscount = await models.Discount.findOne({
                type_campaign: 1,
                start_date_num: {$lte: TIME_NOW},// start_date_num >= TIME_NOW
                end_date_num: {$gte: TIME_NOW},// >=
            });
            // console.log(CampaingDiscount);
            let BestProducts = await models.Product.find({state: 2}).sort({"createdAt": -1});

            var ObjectBestProducts = [];
            for (const Product of BestProducts) {
                let VARIEDADES = await models.Variedad.find({product: Product._id});
                let REVIEWS = await models.Review.find({product: Product._id});
                let AVG_REVIEW = REVIEWS.length > 0 ? Math.ceil(REVIEWS.reduce((sum,item) => sum + item.cantidad,0)/REVIEWS.length) : 0;
                let COUNT_REVIEW = REVIEWS.length;
                let DISCOUNT_EXITS = null;
                if(CampaingDiscount){
                    if(CampaingDiscount.type_segment == 1){//por producto
                        let products_a = [];
                        CampaingDiscount.products.forEach(item => {
                            products_a.push(item._id);
                        })
                        if(products_a.includes(Product._id+"")){
                            DISCOUNT_EXITS = CampaingDiscount;
                        }
                    }else{//por categoria
                        let categories_a = [];
                        CampaingDiscount.categories.forEach(item => {
                            categories_a.push(item._id);
                        })
                        if(categories_a.includes(Product.categorie+"")){
                            DISCOUNT_EXITS = CampaingDiscount;
                        }
                    }
                }
                ObjectBestProducts.push(resource.Product.product_list(Product,VARIEDADES,AVG_REVIEW,COUNT_REVIEW,DISCOUNT_EXITS));
            }

            let OursProducts = await models.Product.find({state: 2}).sort({"createdAt": 1});

            var ObjectOursProducts = [];
            for (const Product of OursProducts) {
                let VARIEDADES = await models.Variedad.find({product: Product._id});
                let REVIEWS = await models.Review.find({product: Product._id});
                let AVG_REVIEW = REVIEWS.length > 0 ? Math.ceil(REVIEWS.reduce((sum,item) => sum + item.cantidad,0)/REVIEWS.length) : 0;
                let COUNT_REVIEW = REVIEWS.length;
                let DISCOUNT_EXITS = null;
                if(CampaingDiscount){
                    if(CampaingDiscount.type_segment == 1){//por producto
                        let products_a = [];
                        CampaingDiscount.products.forEach(item => {
                            products_a.push(item._id);
                        })
                        if(products_a.includes(Product._id+"")){
                            DISCOUNT_EXITS = CampaingDiscount;
                        }
                    }else{//por categoria
                        let categories_a = [];
                        CampaingDiscount.categories.forEach(item => {
                            categories_a.push(item._id);
                        })
                        if(categories_a.includes(Product.categorie+"")){
                            DISCOUNT_EXITS = CampaingDiscount;
                        }
                    }
                }
                ObjectOursProducts.push(resource.Product.product_list(Product,VARIEDADES,AVG_REVIEW,COUNT_REVIEW,DISCOUNT_EXITS));
            }
            // OursProducts = OursProducts.map(async (product) => {
            //     let VARIEDADES = await models.Variedad.find({product: product._id});
            //     return resource.Product.product_list(product,VARIEDADES);
            // })

            let FlashSale = await models.Discount.findOne({
                type_campaign: 2,
                start_date_num: {$lte: TIME_NOW},// start_date_num >= TIME_NOW
                end_date_num: {$gte: TIME_NOW},// >=
            });

            let ProductList = [];
            if(FlashSale){
                for (const product of FlashSale.products) {
                    var ObjecT = await models.Product.findById({_id: product._id});
                    let VARIEDADES = await models.Variedad.find({product: product._id});
                    ProductList.push(resource.Product.product_list(ObjecT,VARIEDADES));
                }
            }
            // console.log(FlashSale);
            res.status(200).json({
                sliders: Sliders,
                categories: Categories,
                best_products: ObjectBestProducts,
                our_products: ObjectOursProducts,
                FlashSale: FlashSale,
                campaign_products: ProductList,
            });
        } catch (error) {
            res.status(500).send({
                message:"OCURRIO ERROR"
            });
            console.log(error);
        }
    },
    show_landing_product: async(req, res) => {
        try {
            let SLUG = req.params.slug;
            let DISCOUNT_ID = req.query._id;
            
            // 🔴 AGREGAR LOGS
            console.log('🔍 Buscando producto con slug:', SLUG);
            console.log('🔍 Discount ID:', DISCOUNT_ID);
            
            let Product = await models.Product.findOne({ slug: SLUG, state: 2 }).populate('categorie');
            
            // 🔴 VALIDAR SI EXISTE
            if (!Product) {
                console.error('❌ Producto no encontrado con slug:', SLUG);
                return res.status(404).json({
                    message: 'PRODUCTO NO ENCONTRADO'
                });
            }
            
            console.log('✅ Producto encontrado:', Product.title);
            
            let VARIEDADES = await models.Variedad.find({ product: Product._id });
            let REVIEWS = await models.Review.find({ product: Product._id }).populate('user');
            
            let AVG_REVIEW = REVIEWS.length > 0 
                ? Math.ceil(REVIEWS.reduce((sum, item) => sum + item.cantidad, 0) / REVIEWS.length) 
                : 0;
            let COUNT_REVIEW = REVIEWS.length;
            
            let DISCOUNT_EXITS = null;
            if (DISCOUNT_ID) {
                let DISCOUNT = await models.Discount.findById({ _id: DISCOUNT_ID });
                if (DISCOUNT) {
                    if (DISCOUNT.type_segment == 1) {
                        let existProduct = DISCOUNT.products.find(p => p._id == Product._id.toString());
                        if (existProduct) {
                            DISCOUNT_EXITS = DISCOUNT;
                        }
                    } else {
                        let existCategorie = DISCOUNT.categories.find(c => c._id == Product.categorie._id.toString());
                        if (existCategorie) {
                            DISCOUNT_EXITS = DISCOUNT;
                        }
                    }
                }
            }
            
            res.status(200).json({
                product: resource.Product.product_list(Product, VARIEDADES, AVG_REVIEW, COUNT_REVIEW, DISCOUNT_EXITS),
                reviews: REVIEWS
            });
        } catch (error) {
            console.error('❌ ERROR en show_landing_product:', error);
            res.status(500).send({
                message: "OCURRIO UN PROBLEMA AL OBTENER EL PRODUCTO"
            });
        }
    },
    search_product:async(req,res) => {
        try {
            var TIME_NOW  = req.query.TIME_NOW;
            let search_product = req.body.search_product;
            let OursProducts = await models.Product.find({state: 2,title: new RegExp(search_product,'i')}).sort({"createdAt": 1});

            let CampaingDiscount = await models.Discount.findOne({
                type_campaign: 1,
                start_date_num: {$lte: TIME_NOW},// start_date_num >= TIME_NOW
                end_date_num: {$gte: TIME_NOW},// >=
            });

            var Products = [];
            for (const Product of OursProducts) {
                let VARIEDADES = await models.Variedad.find({product: Product._id});
                let REVIEWS = await models.Review.find({product: Product._id});
                let AVG_REVIEW = REVIEWS.length > 0 ? Math.ceil(REVIEWS.reduce((sum,item) => sum + item.cantidad,0)/REVIEWS.length) : 0;
                let COUNT_REVIEW = REVIEWS.length;
                let DISCOUNT_EXITS = null;
                if(CampaingDiscount){
                    if(CampaingDiscount.type_segment == 1){//por producto
                        let products_a = [];
                        CampaingDiscount.products.forEach(item => {
                            products_a.push(item._id);
                        })
                        if(products_a.includes(Product._id+"")){
                            DISCOUNT_EXITS = CampaingDiscount;
                        }
                    }else{//por categoria
                        let categories_a = [];
                        CampaingDiscount.categories.forEach(item => {
                            categories_a.push(item._id);
                        })
                        if(categories_a.includes(Product.categorie+"")){
                            DISCOUNT_EXITS = CampaingDiscount;
                        }
                    }
                }
                Products.push(resource.Product.product_list(Product,VARIEDADES,AVG_REVIEW,COUNT_REVIEW,DISCOUNT_EXITS));
            }
            res.status(200).json({
                products: Products,
            });
        } catch (error) {
            console.log(error);
            res.status(500).send({
                message: "Ocurrio un error",
            });
        }
    },
    profile_client:async(req,res) => {
        try {
            
            let user_id = req.body.user_id;

            let Orders = await models.Sale.find({user: user_id});

            let sale_orders = [];

            for (const order of Orders) {
                let detail_orders = await models.SaleDetail.find({sale: order._id}).populate({
                    path: "product",
                    populate: {
                        path: "categorie"
                    },
                }).populate("variedad");
                let sale_address = await models.SaleAddress.find({sale: order._id});
                let collection_detail_orders = [];
                for (const detail_order of detail_orders) {
                    let reviewS = await models.Review.findOne({sale_detail: detail_order._id});
                    collection_detail_orders.push({
                        _id: detail_order._id,
                        product: {
                            _id: detail_order.product._id,
                            title: detail_order.product.title,
                            sku: detail_order.product.sku,
                            slug: detail_order.product.slug,
                            imagen: process.env.URL_BACKEND+'/api/products/uploads/product/'+detail_order.product.portada,//*
                            categorie: detail_order.product.categorie,
                            price_usd: detail_order.product.price_usd,
                        },
                        type_discount: detail_order.type_discount,
                        discount: detail_order.discount,
                        cantidad: detail_order.cantidad,
                        variedad: detail_order.variedad,
                        code_cupon: detail_order.code_cupon,
                        code_discount: detail_order.code_discount,
                        price_unitario: detail_order.price_unitario,
                        subtotal: detail_order.subtotal,
                        total: detail_order.total,
                        review: reviewS,
                    })
                }
                sale_orders.push({
                    sale: order,
                    sale_details: collection_detail_orders,
                    sale_address: sale_address,
                });
            }
            let ADDRESS_CLIENT = await models.AddressClient.find({user: user_id}).sort({'createdAt': -1});
            res.status(200).json({
                sale_orders: sale_orders,
                address_client: ADDRESS_CLIENT,
            })

        } catch (error) {
            console.log(error);
            res.status(500).send({
                message: "Ocurrio un error",
            });
        }
    },
    update_client: async(req,res) => {
        try {
            if(req.files){
                var img_path = req.files.avatar.path;
                var name = img_path.split('\\');
                var avatar_name = name[2];
                console.log(avatar_name)
            }
            if(req.body.password){
                req.body.password = await bcrypt.hash(req.body.password,10);
            }
            await models.User.findByIdAndUpdate({_id: req.body._id},req.body);
            let User = await models.User.findOne({_id: req.body._id});
            res.status(200).json({
                message: "SE GUARDO SU INFORMACIÓN CORRECTAMENTE",
                user: {
                    name: User.name,
                    surname: User.surname,
                    email:User.email,
                    _id:User._id,
                }
            });
        } catch (error) {
            console.log(error);
            res.status(500).send({
                message: "Ocurrio un error",
            });
        }
    },
    config_initial:async(req,res) => {
        try {
            let categories = await models.Categorie.find({state: 1});
            let variedades = await models.Variedad.find({});
            res.status(200).json({
                categories: categories,
                variedades: variedades,
            });
        } catch (error) {
            console.log(error);
            res.status(500).send({
                message: "Ocurrio un error",
            });
        }
    },
    filter_products: async(req, res) => {
    try {
        var TIME_NOW = req.query.TIME_NOW;
        var filters = req.body;

        console.log('🔍 Filtros recibidos:', filters);

        // Construir query de filtros
        var query = { state: 2 }; // Solo productos públicos

        // Filtro por categoría
        if (filters.categorie) {
            query.categorie = filters.categorie;
        }

        // Filtro por rango de precio
        if (filters.min_price !== undefined && filters.max_price !== undefined) {
            query.price_usd = {
                $gte: parseFloat(filters.min_price),
                $lte: parseFloat(filters.max_price)
            };
        }

        // Filtro por búsqueda de texto
        if (filters.search) {
            query.$or = [
                { title: new RegExp(filters.search, 'i') },
                { tags: new RegExp(filters.search, 'i') }
            ];
        }

        console.log('🔎 Query construido:', query);

        // Buscar productos con populate
        let Products = await models.Product.find(query)
            .populate('categorie')
            .sort({ createdAt: -1 })
            .limit(50);

        console.log(`✅ Productos encontrados: ${Products.length}`);

        // Buscar descuentos activos
        let CampaingDiscount = await models.Discount.findOne({
            type_campaign: 1,
            start_date_num: { $lte: TIME_NOW },
            end_date_num: { $gte: TIME_NOW },
        });

        // Mapear productos con variedades y reseñas
        var ObjectProducts = [];
        for (const Product of Products) {
            try {
                let VARIEDADES = await models.Variedad.find({ product: Product._id });
                let REVIEWS = await models.Review.find({ product: Product._id });

                let avg_review = 0;
                let count_review = REVIEWS.length;

                if (count_review > 0) {
                    let sum = REVIEWS.reduce((acc, review) => acc + review.cantidad, 0);
                    avg_review = parseFloat((sum / count_review).toFixed(1));
                }

                // Verificar si el producto tiene descuento
                let ProductDiscount = null;
                if (CampaingDiscount) {
                    if (CampaingDiscount.type_segment == 1) {
                        // Descuento por producto
                        let existProduct = CampaingDiscount.products.find(
                            p => p._id == Product._id.toString()
                        );
                        if (existProduct) {
                            ProductDiscount = CampaingDiscount;
                        }
                    } else {
                        // Descuento por categoría
                        let existCategorie = CampaingDiscount.categories.find(
                            c => c._id == Product.categorie._id.toString()
                        );
                        if (existCategorie) {
                            ProductDiscount = CampaingDiscount;
                        }
                    }
                }

                ObjectProducts.push(
                    resource.Product.product_list(
                        Product,
                        VARIEDADES,
                        avg_review,
                        count_review,
                        ProductDiscount
                    )
                );
            } catch (productError) {
                console.error(`❌ Error procesando producto ${Product._id}:`, productError);
            }
        }

        res.status(200).json({
            products: ObjectProducts,
        });

    } catch (error) {
        console.error('❌ ERROR EN filter_products:', error);
        res.status(500).send({
            message: "OCURRIO UN ERROR AL FILTRAR PRODUCTOS",
            error: error.message
        });
    }
},
}