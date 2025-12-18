import token from '../services/token.js'

export default {
    verifyEcommerce: async(req,res,next) => {
        const authHeader = req.headers.authorization || req.headers.token;
        
        if(!authHeader){
            return res.status(404).send({
                message: 'NO SE ENVIO EL TOKEN'
            });
        }
        const tokenValue = authHeader.startsWith('Bearer ') 
            ? authHeader.split(' ')[1] 
            : authHeader;

        console.log('🔐 Token recibido:', tokenValue.substring(0, 20) + '...');

        const response = await token.decode(tokenValue);
        
        if(response){
            if(response.rol == "cliente" || response.rol == "admin"){
                req.user = {
                    sub: response._id,
                    rol: response.rol,
                    email: response.email
                };
                
                console.log('✅ Usuario autenticado:', req.user);
                next();
            }else{
                res.status(403).send({
                    message: 'NO ESTA PERMITIDO VISITAR ESTA RUTA'
                });
            }
        }else{
            res.status(403).send({
                message: 'EL TOKEN NO ES VALIDO'
            });
        }
    },
    verifyAdmin: async(req,res,next) => {
        const authHeader = req.headers.authorization || req.headers.token;
        
        if(!authHeader){
            return res.status(404).send({
                message: 'NO SE ENVIO EL TOKEN'
            });
        }

        const tokenValue = authHeader.startsWith('Bearer ') 
            ? authHeader.split(' ')[1] 
            : authHeader;

        const response = await token.decode(tokenValue);
        
        if(response){
            if(response.rol == "admin"){
                req.user = {
                    sub: response._id,
                    rol: response.rol,
                    email: response.email
                };
                next();
            }else{
                res.status(403).send({
                    message: 'NO ESTA PERMITIDO VISITAR ESTA RUTA'
                });
            }
        }else{
            res.status(403).send({
                message: 'EL TOKEN NO ES VALIDO'
            });
        }
    }
}