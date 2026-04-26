export default {
    product_list: (product,variedades = [],avg_review = 0,count_review = 0,CampaingDiscount = null) => {
        var IMAGEN_TWO = "";
        let GALERIAS = product.galerias.map((galeria) => {
            galeria.imagen = galeria.imagen.startsWith('http') ? galeria.imagen : process.env.URL_BACKEND + '/api/products/uploads/product/' + galeria.imagen;
            return galeria;
        });
        var VAL = GALERIAS.length > 0 ? Math.floor(Math.random() * GALERIAS.length) : 0;
        IMAGEN_TWO = GALERIAS.length > 0 ? GALERIAS[VAL].imagen : '';
        
        // Manejar tags: puede ser string o JSON
        let tagsArray = [];
        if (product.tags) {
            try {
                // Intentar parsear como JSON
                tagsArray = JSON.parse(product.tags);
            } catch (e) {
                // Si falla, dividir por comas
                tagsArray = product.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            }
        }
        
        return {
            _id: product._id,
            title: product.title,
            sku: product.sku,
            slug: product.slug,
            imagen: product.portada.startsWith('http') ? product.portada : process.env.URL_BACKEND + '/api/products/uploads/product/' + product.portada,
            categorie: product.categorie,
            price_usd: product.price_usd,
            stock: product.stock,
            description: product.description,
            resumen: product.resumen,
            tags: tagsArray,
            type_inventario: product.type_inventario,
            state: product.state,
            variedades: variedades,
            imagen_two: IMAGEN_TWO,
            galerias:GALERIAS,
            avg_review: avg_review,
            count_review: count_review,
            campaing_discount: CampaingDiscount,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt
        }
    }
}