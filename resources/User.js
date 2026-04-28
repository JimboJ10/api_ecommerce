export default {
    user_list: (user) => {
        return {
            _id: user._id,
            name: user.name,
            surname: user.surname,
            dni: user.dni,
            email: user.email,
            avatar: user.avatar,
            rol: user.rol,
            phone: user.phone,
            state: user.state,
            birthday: user.birthday,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }
    }
}