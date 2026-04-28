import models from '../models/index.js';
import resource from '../resources/index.js';
import fs from 'fs';
import handlebars from 'handlebars';
import ejs from 'ejs';
import nodemailer from 'nodemailer';
import smtpTransport from 'nodemailer-smtp-transport';

async function send_email(sale_id) {
    try {

        var readHTMLFile = function(path, callback) {
            fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
                if (err) {
                    console.error('❌ Error al leer archivo HTML:', err);
                    callback(err);
                }
                else {
                    callback(null, html);
                }
            });
        };  
        
        let Order = await models.Sale.findById({_id: sale_id}).populate("user");
        let OrderDetail = await models.SaleDetail.find({sale: Order._id}).populate("product").populate("variedad");
        let AddressSale = await models.SaleAddress.findOne({sale: Order._id});

        // CONFIGURAR TRANSPORTER CON tls: { rejectUnauthorized: false }
        var transporter = nodemailer.createTransport(smtpTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true para 465, false para otros puertos
            auth: {
                user: 'jimbojordy383@gmail.com',
                pass: 'rqezqdodoblkriss'
            },
            tls: {
                rejectUnauthorized: false // Aceptar certificados autofirmados
            }
        }));

        readHTMLFile(process.cwd() + '/mails/email_sale.html', (err, html)=>{
            if (err) {
                console.error('❌ Error al leer template:', err);
                return;
            }
                                
            let rest_html = ejs.render(html, {
                order: Order,
                address_sale: AddressSale,
                order_detail: OrderDetail
            });
    
            var template = handlebars.compile(rest_html);
            var htmlToSend = template({op:true});
    
            var mailOptions = {
                from: 'jimbojordy383@gmail.com',
                to: Order.user.email,
                subject: 'Confirmación de tu pedido #' + Order._id.toString().substring(Order._id.toString().length - 8),
                html: htmlToSend
            };

            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    console.error('❌ Error al enviar email:', error);
                } else {
                    console.log('✅ Email enviado exitosamente:', info.response);
                    console.log('📧 MessageId:', info.messageId);
                }
            });
        
        });

    } catch (error) {
        console.error('❌ Error en send_email:', error);
    }
}

export default {
    register: async(req,res) => {
        try {

            let sale_data = req.body.sale;
            let sale_address_data = req.body.sale_address;

            if (!sale_address_data?.dni) {
                return res.status(400).json({
                    message: "EL DNI O CÉDULA ES REQUERIDO PARA GENERAR LA ORDEN",
                });
            }

            let SALE = await models.Sale.create(sale_data);

            sale_address_data.sale = SALE._id;

            let SALE_ADDRESS = await models.SaleAddress.create(sale_address_data);

            let CARTS = await models.Cart.find({user: SALE.user});
            
            for (let CART of CARTS) {
                CART = CART.toObject();
                CART.sale = SALE._id;

                // Descontar inventario
                if(CART.variedad){
                    let VARIEDAD = await models.Variedad.findById({_id: CART.variedad});
                    let new_stock = VARIEDAD.stock - CART.cantidad;

                    await models.Variedad.findByIdAndUpdate({_id: CART.variedad},{
                        stock: new_stock,
                    });
                } else {
                    let PRODUCT = await models.Product.findById({_id: CART.product});
                    let new_stock = PRODUCT.stock - CART.cantidad;

                    await models.Product.findByIdAndUpdate({_id: CART.product},{
                        stock: new_stock,
                    });
                }

                await models.SaleDetail.create(CART);
                await models.Cart.findByIdAndDelete({_id: CART._id});
            }
            await send_email(SALE._id);

            res.status(200).json({
                message: "LA ORDEN SE GENERO CORRECTAMENTE",
                sale_id: SALE._id
            });

        } catch (error) {
            console.error('❌ Error al registrar orden:', error);
            res.status(500).send({
                message: "HUBO UN ERROR",
            });
        }
    },
    list: async(req,res) => {
        try {
            // Obtener user_id del query o del token
            let user_id = req.query.user_id;
            
            if (!user_id) {
                if (!req.user || !req.user.sub) {
                    return res.status(401).json({
                        message: "NO AUTORIZADO - Token inválido"
                    });
                }
                user_id = req.user.sub;
            }

            // Buscar todas las órdenes del usuario
            let SALES = await models.Sale.find({ user: user_id })
                .populate('user')
                .sort({ createdAt: -1 });

            res.status(200).json({
                sales: SALES
            });

        } catch (error) {
            console.error('❌ Error al obtener órdenes:', error);
            res.status(500).send({
                message: "HUBO UN ERROR AL OBTENER LAS ÓRDENES",
            });
        }
    },

    show: async(req,res) => {
        try {
            let sale_id = req.params.id;
            
            let SALE = await models.Sale.findById({_id: sale_id}).populate("user");
            
            if (!SALE) {
                return res.status(404).json({
                    message: "ORDEN NO ENCONTRADA"
                });
            }
            
            let SALE_DETAILS = await models.SaleDetail.find({sale: sale_id})
                .populate("product")
                .populate("variedad");
            
            let SALE_ADDRESS = await models.SaleAddress.findOne({sale: sale_id});

            // FORMATEAR LOS DETALLES CON EL RESOURCE
            SALE_DETAILS = SALE_DETAILS.map((detail) => {
                return resource.Sale.sale_detail_list(detail);
            });

            res.status(200).json({
                sale: SALE,
                sale_details: SALE_DETAILS,
                sale_address: SALE_ADDRESS,
            });
        } catch (error) {
            console.error('❌ Error al obtener detalle de orden:', error);
            res.status(500).send({
                message: "HUBO UN ERROR",
            });
        }
    },
    list_all: async(req, res) => {
        try {

            let SALES = await models.Sale.find()
                .populate('user')
                .sort({ createdAt: -1 });

            res.status(200).json({
                sales: SALES
            });

        } catch (error) {
            console.error('❌ Error al obtener todas las órdenes:', error);
            res.status(500).send({
                message: "HUBO UN ERROR AL OBTENER LAS ÓRDENES",
            });
        }
    },

    // Obtener estadísticas para el dashboard
    stats: async(req, res) => {
        try {

            // Total de ventas
            const totalSales = await models.Sale.countDocuments();

            // Total de ingresos
            const salesData = await models.Sale.find();
            const totalRevenue = salesData.reduce((sum, sale) => sum + sale.total, 0);

            // Total de usuarios
            const totalUsers = await models.User.countDocuments({ rol: 'cliente' });

            // Total de productos
            const totalProducts = await models.Product.countDocuments({ state: 2 });

            // Ventas de los últimos 7 días
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const recentSales = await models.Sale.find({
                createdAt: { $gte: sevenDaysAgo }
            });

            // Ventas por día (últimos 7 días)
            const salesByDay = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                
                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + 1);
                
                const daySales = await models.Sale.find({
                    createdAt: {
                        $gte: date,
                        $lt: nextDate
                    }
                });
                
                const dayRevenue = daySales.reduce((sum, sale) => sum + sale.total, 0);
                
                salesByDay.push({
                    date: date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
                    sales: daySales.length,
                    revenue: dayRevenue
                });
            }

            // Top 5 productos más vendidos
            const topProducts = await models.SaleDetail.aggregate([
                {
                    $group: {
                        _id: '$product',
                        total_vendido: { $sum: '$cantidad' },
                        total_ingresos: { $sum: '$total' }
                    }
                },
                { $sort: { total_vendido: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: 'products',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'producto'
                    }
                },
                { $unwind: '$producto' }
            ]);

            // Últimas 5 ventas
            const latestSales = await models.Sale.find()
                .populate('user')
                .sort({ createdAt: -1 })
                .limit(5);

            res.status(200).json({
                totalSales,
                totalRevenue,
                totalUsers,
                totalProducts,
                recentSales: recentSales.length,
                salesByDay,
                topProducts: topProducts.map(item => ({
                    product: {
                        _id: item.producto._id,
                        title: item.producto.title,
                        portada: item.producto.portada
                    },
                    total_vendido: item.total_vendido,
                    total_ingresos: item.total_ingresos
                })),
                latestSales: latestSales.map(sale => ({
                    _id: sale._id,
                    user: {
                        name: sale.user.name,
                        email: sale.user.email
                    },
                    total: sale.total,
                    createdAt: sale.createdAt
                }))
            });

        } catch (error) {
            console.error('❌ Error al obtener estadísticas:', error);
            res.status(500).send({
                message: "HUBO UN ERROR",
            });
        }
    }
}