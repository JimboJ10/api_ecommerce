export default {
    sale_detail_list: (sale_detail) => {
        return {
            _id: sale_detail._id,
            sale: sale_detail.sale,
            product: {
                _id: sale_detail.product._id,
                title: sale_detail.product.title,
                sku: sale_detail.product.sku,
                slug: sale_detail.product.slug,
                imagen: process.env.URL_BACKEND + '/api/products/uploads/product/' + sale_detail.product.portada,
                categorie: sale_detail.product.categorie,
                price_usd: sale_detail.product.price_usd,
                type_inventario: sale_detail.product.type_inventario,
            },
            type_discount: sale_detail.type_discount,
            discount: sale_detail.discount,
            cantidad: sale_detail.cantidad,
            variedad: sale_detail.variedad,
            code_cupon: sale_detail.code_cupon,
            code_discount: sale_detail.code_discount,
            price_unitario: sale_detail.price_unitario,
            subtotal: sale_detail.subtotal,
            total: sale_detail.total,
        }
    }
}