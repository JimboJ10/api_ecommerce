import models from "../models/index.js";

export default {
    register:async(req,res) => {
        try {
            if (!req.body.dni) {
                return res.status(400).send({
                    message: "EL DNI O CÉDULA ES REQUERIDO",
                });
            }

            const address_client = await models.AddressClient.create(req.body);

            if (req.body.user) {
                await models.User.findByIdAndUpdate(
                    { _id: req.body.user },
                    { $set: { dni: req.body.dni } }
                );
            }

            res.status(200).json({
                message: "LA DIRECCIÓN DEL CLIENTE SE REGISTRO CORRECTAMENTE",
                address_client: address_client,
            });
        } catch (error) {
            console.log(error);
            res.status(500).send({
                message: "HUBO UN ERROR",
            });
        }
    },
    update:async(req,res) => {
        try {
            if (!req.body.dni) {
                return res.status(400).send({
                    message: "EL DNI O CÉDULA ES REQUERIDO",
                });
            }

            let data = req.body;
            await models.AddressClient.findByIdAndUpdate({_id: req.body._id},data);
            let AddressClient = await models.AddressClient.findById({_id: req.body._id});

            if (AddressClient?.user) {
                await models.User.findByIdAndUpdate(
                    { _id: AddressClient.user },
                    { $set: { dni: req.body.dni } }
                );
            }

            res.status(200).json({
                message: "LA DIRECCIÓN DEL CLIENTE SE EDITO CORRECTAMENTE",
                address_client: AddressClient,
            });
        } catch (error) {
            console.log(error);
            res.status(500).send({
                message: "HUBO UN ERROR",
            });
        }
    },
    list:async(req,res) => {
        try {
            let ADDRESS_CLIENT = await models.AddressClient.find({user: req.query.user_id}).sort({'createdAt': -1});
            res.status(200).json({
                address_client: ADDRESS_CLIENT
            });
        } catch (error) {
            console.log(error);
            res.status(500).send({
                message: "HUBO UN ERROR",
            });
        }
    },
    remove:async(req,res) => {
        try {
            await models.AddressClient.findByIdAndDelete({_id: req.params.id});
            res.status(200).json({
                message: "LA DIRECCIÓN DEL CLIENTE SE ELIMINO CORRECTAMENTE",
            });
        } catch (error) {
            console.log(error);
            res.status(500).send({
                message: "HUBO UN ERROR",
            });
        }
    },
}