import bcrypt from 'bcryptjs'
import models from '../models/index.js'
import token from '../services/token.js'
import resource from '../resources/index.js'
import path from 'path'

export default {
    register: async(req,res) => {
        try {
            const email = (req.body.email || '').toLowerCase().trim();

            if (!email || !req.body.password || !req.body.name) {
                return res.status(400).send({
                    message: 'FALTAN DATOS REQUERIDOS'
                });
            }

            const userV = await models.User.findOne({ email });
            if (userV) {
                return res.status(409).send({
                    message: 'EL CORREO YA ESTA REGISTRADO'
                });
            }

            req.body.email = email;
            req.body.password = await bcrypt.hash(req.body.password,10);
            const user = await models.User.create(req.body);
            res.status(200).json(user);
        } catch (error) {
            if (error?.code === 11000) {
                return res.status(409).send({
                    message: 'EL CORREO YA ESTA REGISTRADO'
                });
            }

            res.status(500).send({
                message: "OCURRIO UN PROBLEMA"
            });
            console.log(error);
        }
    },
    register_admin: async(req,res) => {
        try {
            // rol
            // name
            // surname
            // email
            // password
            const userV = await models.User.findOne({email: req.body.email});
            if(userV){
                res.status(500).send({
                    message: "EL USUARIO YA EXISTE"
                });
            }
            req.body.rol = "admin";
            req.body.password = await bcrypt.hash(req.body.password,10);
            let user = await models.User.create(req.body);
            res.status(200).json({
                user: resource.User.user_list(user)
            });
        } catch (error) {
            res.status(500).send({
                message: "OCURRIO UN PROBLEMA"
            });
            console.log(error);
        }
    },
    login: async(req,res) => {
        try {
            const email = (req.body.email || '').toLowerCase().trim();
            const user = await models.User.findOne({email: email, state:1});
            
            if(user){
                let compare = await bcrypt.compare(req.body.password, user.password);
                
                if(compare){
                    let tokenT = await token.encode(user._id, user.rol, user.email);

                    res.status(200).json({
                        token: tokenT,
                        user: {
                            _id: user._id,
                            name: user.name,
                            email: user.email,
                            surname: user.surname,
                            dni: user.dni,
                            avatar: user.avatar,
                            rol: user.rol,
                            phone: user.phone,
                        }
                    });
                } else {
                    res.status(401).send({
                        message: "LA CONTRASEÑA ES INCORRECTA"
                    });
                }
            } else {
                res.status(404).send({
                    message: "EL USUARIO NO EXISTE"
                });
            }
        } catch (error) {
            res.status(500).send({
                message: "OCURRIO UN PROBLEMA"
            });
            console.log(error);
        }
    },
    login_admin: async(req,res) => {
        try {
            const user = await models.User.findOne({email: req.body.email,state:1,rol: "admin"});
            if(user){
                //SI ESTA RGISTRADO EN EL SISTEMA
                let compare = await bcrypt.compare(req.body.password,user.password);
                if(compare){
                    let tokenT = await token.encode(user._id,user.rol,user.email);

                    const USER_FRONTED = {
                        token:tokenT,
                        user: {
                            name: user.name,
                            email: user.email,
                            surname: user.surname,
                                dni: user.dni,
                            avatar: user.avatar,
                            rol: user.rol,
                        },
                    }

                    res.status(200).json({
                        USER_FRONTED:USER_FRONTED,
                    })
                }else{
                    res.status(500).send({
                        message: "EL USUARIO NO EXISTE"
                    });
                }
            }else{
                res.status(500).send({
                    message: "EL USUARIO NO EXISTE"
                });
            }
        } catch (error) {
            res.status(500).send({
                message: "OCURRIO UN PROBLEMA"
            });
            console.log(error);
        }
    },
    update: async(req,res) => {
        try {
            if (req.files?.avatar?.path) {
                req.body.avatar = path.basename(req.files.avatar.path);
            }
            if(req.body.password){
                req.body.password = await bcrypt.hash(req.body.password,10);
            }
            if (req.body.dni !== undefined) {
                req.body.dni = (req.body.dni || '').trim();
            }

            await models.User.findByIdAndUpdate({_id: req.body._id},req.body);

            if (req.body.dni !== undefined && req.body._id) {
                await models.AddressClient.updateMany(
                    { user: req.body._id },
                    { $set: { dni: req.body.dni } }
                );
            }

            let UserT = await models.User.findOne({_id: req.body._id});
            res.status(200).json({
                message: "EL USUARIO SE HA MODIFICADO CORRECTAMENTE",
                user: resource.User.user_list(UserT),
            });
        } catch (error) {
            res.status(500).send({
                message: "OCURRIO UN PROBLEMA"
            });
            console.log(error);
        }
    },
    list: async(req,res) => {
        try {
            var search = req.query.search;
            let Users = await models.User.find({
                $or:[
                    {"name": new RegExp(search, "i")},
                    {"surname": new RegExp(search, "i")},
                    {"email": new RegExp(search, "i")},
                ]
            }).sort({'createdAt': -1});

            Users = Users.map((user) => {
                return resource.User.user_list(user);
            })

            res.status(200).json({
                users: Users
            });
        } catch (error) {
            res.status(500).send({
                message: "OCURRIO UN PROBLEMA"
            });
            console.log(error);
        }
    },
    remove: async(req,res) => {
        try {
            const User = await models.User.findByIdAndDelete({_id: req.query._id});
            res.status(200).json({
                message: "EL USUARIO SE ELIMINO CORRECTAMENTE",
            });
        } catch (error) {
            res.status(500).send({
                message: "OCURRIO UN PROBLEMA"
            });
            console.log(error);
        }
    },
    change_password: async(req, res) => {
        try {
            const { user_id, current_password, new_password } = req.body;

            // Validar que vengan todos los datos
            if (!user_id || !current_password || !new_password) {
                return res.status(400).json({
                    message: 400,
                    message_text: "FALTAN DATOS REQUERIDOS"
                });
            }

            // Buscar el usuario
            const user = await models.User.findById(user_id);

            if (!user) {
                console.error('❌ Usuario no encontrado:', user_id);
                return res.status(404).json({
                    message: 404,
                    message_text: "USUARIO NO ENCONTRADO"
                });
            }

            // Verificar la contraseña actual
            const isPasswordValid = await bcrypt.compare(current_password, user.password);

            if (!isPasswordValid) {
                console.error('❌ Contraseña actual incorrecta');
                return res.status(401).json({
                    message: 401,
                    message_text: "LA CONTRASEÑA ACTUAL ES INCORRECTA"
                });
            }

            // Validar que la nueva contraseña sea diferente
            const isSamePassword = await bcrypt.compare(new_password, user.password);

            if (isSamePassword) {
                console.error('❌ Nueva contraseña igual a la actual');
                return res.status(400).json({
                    message: 400,
                    message_text: "LA NUEVA CONTRASEÑA DEBE SER DIFERENTE A LA ACTUAL"
                });
            }

            // Encriptar la nueva contraseña
            const hashedPassword = await bcrypt.hash(new_password, 10);

            // Actualizar la contraseña
            await models.User.findByIdAndUpdate(user_id, {
                password: hashedPassword
            });

            res.status(200).json({
                message: 200,
                message_text: "CONTRASEÑA ACTUALIZADA CORRECTAMENTE"
            });

        } catch (error) {
            console.error('❌ Error al cambiar contraseña:', error);
            res.status(500).json({
                message: 500,
                message_text: "ERROR AL CAMBIAR LA CONTRASEÑA"
            });
        }
    },
}