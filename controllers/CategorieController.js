import models from '../models/index.js'
import resource from '../resources/index.js'
import fs from 'fs'
import path from 'path'

export default {
    register: async(req,res) => {
        try {
            if (req.file?.path) {
                req.body.imagen = path.basename(req.file.path);
            }
            const categorie = await models.Categorie.create(req.body);
            res.status(200).json(categorie);
        } catch (error) {
            res.status(500).send({
                message: "OCURRIO UN PROBLEMA"
            });
            console.log(error);
        }
    },
    update: async(req,res) => {
        try {
            if (req.file?.path) {
                req.body.imagen = path.basename(req.file.path);
            }
            await models.Categorie.findByIdAndUpdate({_id: req.body._id},req.body);

            let CategorieT = await models.Categorie.findOne({_id: req.body._id});
            res.status(200).json({
                message: "LA CATEGORIA SE HA MODIFICADO CORRECTAMENTE",
                categorie: resource.Categorie.categorie_list(CategorieT),
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
            let Categories = await models.Categorie.find({
                $or:[
                    {"title": new RegExp(search, "i")},
                ]
            }).sort({'createdAt': -1});

            Categories = Categories.map((categorie) => {
                return resource.Categorie.categorie_list(categorie);
            })

            res.status(200).json({
                categories: Categories
            });
        } catch (error) {
            res.status(500).send({
                message: "OCURRIO UN PROBLEMA"
            });
            console.log(error);
        }
    },
    obtener_imagen: async(req,res) => {
        try {
            var img = req.params['img'];

            fs.stat('./uploads/categorie/'+img, function(err){
                if(!err){
                    let path_img = './uploads/categorie/'+img;
                    res.status(200).sendFile(path.resolve(path_img));
                }else{
                    let path_img = './uploads/default.jpg';
                    res.status(200).sendFile(path.resolve(path_img));
                }
            })
        } catch (error) {
            res.status(500).send({
                message: "OCURRIO UN PROBLEMA"
            });
            console.log(error);
        }
    },  
    remove: async(req,res) => {
        try {
            await models.Categorie.findByIdAndDelete({_id: req.query._id});
            res.status(200).json({
                message: "LA CATEGORIA SE ELIMINO CORRECTAMENTE",
            });
        } catch (error) {
            res.status(500).send({
                message: "OCURRIO UN PROBLEMA"
            });
            console.log(error);
        }
    }
}