export default {
    categorie_list: (categorie) => {
        return {
            _id: categorie._id,
            title: categorie.title,
            imagen: categorie.imagen,
            imagen_home: categorie.imagen.startsWith('http') ? categorie.imagen : process.env.URL_BACKEND + '/api/categories/uploads/categorie/' + categorie.imagen,
            state: categorie.state,
            createdAt: categorie.createdAt,
            updatedAt: categorie.updatedAt
        }
    }
}