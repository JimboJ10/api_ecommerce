export default {
    product_list: (product,variedades = [],avg_review = 0,count_review = 0,CampaingDiscount = null) => {
        var IMAGEN_TWO = "";
        let GALERIAS = product.galerias.map((galeria) => {
            galeria.imagen = process.env.URL_BACKEND+'/api/products/uploads/product/'+galeria.imagen;//*
            return galeria;
        });
        var VAL = Math.floor(Math.random() * 3);//0,1,2
        IMAGEN_TWO = GALERIAS[VAL].imagen;
        return {
            _id: product._id,
            title: product.title,
            sku: product.sku,
            slug: product.slug,
            imagen: process.env.URL_BACKEND+'/api/products/uploads/product/'+product.portada,//*
            categorie: product.categorie,
            price_soles: product.price_soles,
            price_usd: product.price_usd,
            stock: product.stock,
            description: product.description,
            resumen: product.resumen,
            tags: product.tags ? JSON.parse(product.tags) : [],
            type_inventario: product.type_inventario,
            state: product.state,
            variedades: variedades,
            imagen_two: IMAGEN_TWO,
            galerias:GALERIAS,
            avg_review: avg_review,
            count_review: count_review,
            campaing_discount: CampaingDiscount,
        }
    }
}