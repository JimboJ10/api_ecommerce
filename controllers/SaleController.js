import models from '../models/index.js';
import resource from '../resources/index.js';
import fs from 'fs';
import handlebars from 'handlebars';
import ejs from 'ejs';
import nodemailer from 'nodemailer';
import smtpTransport from 'nodemailer-smtp-transport';

async function send_email(sale_id) {
    try {
        console.log('📧 Iniciando envío de email para orden:', sale_id);

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

        console.log('📦 Orden encontrada:', Order._id);
        console.log('📦 Detalles de orden:', OrderDetail.length, 'items');
        console.log('📍 Dirección:', AddressSale ? 'SÍ' : 'NO');
        console.log('👤 Usuario:', Order.user.email);

        // 🔴 CONFIGURAR TRANSPORTER CON tls: { rejectUnauthorized: false }
        var transporter = nodemailer.createTransport(smtpTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true para 465, false para otros puertos
            auth: {
                user: 'jimbojordy383@gmail.com',
                pass: 'gjfyjxshcifxcpki'
            },
            tls: {
                rejectUnauthorized: false // 🔴 Aceptar certificados autofirmados
            }
        }));

        readHTMLFile(process.cwd() + '/mails/email_sale.html', (err, html)=>{
            if (err) {
                console.error('❌ Error al leer template:', err);
                return;
            }

            console.log('✅ Template HTML cargado');
                                
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
          
            console.log('📤 Enviando email a:', Order.user.email);

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
            console.log('🛒 Procesando nueva orden...');

            let sale_data = req.body.sale;
            let sale_address_data = req.body.sale_address;

            console.log('💰 Datos de venta:', sale_data);
            console.log('📍 Dirección de envío:', sale_address_data);

            let SALE = await models.Sale.create(sale_data);
            console.log('✅ Orden creada:', SALE._id);

            sale_address_data.sale = SALE._id;

            let SALE_ADDRESS = await models.SaleAddress.create(sale_address_data);
            console.log('✅ Dirección guardada');

            let CARTS = await models.Cart.find({user: SALE.user});
            console.log('🛒 Productos en carrito:', CARTS.length);
            
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
                    console.log('📉 Stock variedad actualizado:', VARIEDAD.valor, '→', new_stock);
                } else {
                    let PRODUCT = await models.Product.findById({_id: CART.product});
                    let new_stock = PRODUCT.stock - CART.cantidad;

                    await models.Product.findByIdAndUpdate({_id: CART.product},{
                        stock: new_stock,
                    });
                    console.log('📉 Stock producto actualizado:', PRODUCT.title, '→', new_stock);
                }

                await models.SaleDetail.create(CART);
                await models.Cart.findByIdAndDelete({_id: CART._id});
            }

            console.log('📧 Enviando email de confirmación...');
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

            console.log('📦 Obteniendo órdenes del usuario:', user_id);

            // Buscar todas las órdenes del usuario
            let SALES = await models.Sale.find({ user: user_id })
                .populate('user')
                .sort({ createdAt: -1 });

            console.log(`✅ Órdenes encontradas: ${SALES.length}`);

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
            
            console.log('🔍 Obteniendo detalle de orden:', sale_id);
            
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

            console.log('✅ Orden encontrada:', SALE._id);
            console.log('📦 Detalles:', SALE_DETAILS.length, 'items');
            console.log('📍 Dirección:', SALE_ADDRESS ? 'SÍ' : 'NO');

            // 🔴 FORMATEAR LOS DETALLES CON EL RESOURCE
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
    }
}