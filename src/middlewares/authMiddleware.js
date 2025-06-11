import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;

export const authMiddleware = (req, res, next) => {
    const auth = req.headers.authorization;
    if(!auth) return res.status(401).json({error: 'Token ausente' });
    try {
        req.user = jwt.verify(auth.split(' ')[1],SECRET);
        next();
    } catch {
        res.status(401).json({error: 'Token inválido'});
    }
}