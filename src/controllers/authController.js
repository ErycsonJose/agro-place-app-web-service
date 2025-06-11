import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import admin from '../../firebase.js';

const SECRET = process.env.JWT_SECRET;

export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password){
      return res.status(401).json({error: 'Credenciais inválidas'});
    }
    try {
        const snapshot = await admin.firestore().collection('usuarios')
        .where('email', '==', email)
        .get();
        if (snapshot.empty) return res.status(401).json({ error: 'Credenciais inválidas' });
        const userDoc = snapshot.docs[0];
        const user = userDoc.data();
        const valid = await bcrypt.compare(password, user.senha);
        if(!valid) return res.status(401).json({error: 'Credenciais inválidas'});
        const token = jwt.sign(
          { id: snapshot.docs[0].id, email: user.email, tipoUsuario: user.tipoUsuario },
          SECRET,
          { expiresIn: '1d' }
        );
        res.json({ token, user });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao fazer login.' });
    }
}
export const signup = async (req, res) => {
  const { id, name, lastName, birthDate, phone, email, password, userType } = req.body;
  if (!id || !name || !lastName || !birthDate || !phone || !email || !password || !userType) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }
  try {
    const snapshot = await admin.firestore().collection('usuarios').where('email', '==', email).get();
    if (!snapshot.empty) {
      return res.status(400).json({ error: 'Email já cadastrado.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await admin.firestore().collection('usuarios').doc(id).set({
      pNome: name,
      sobrenome: lastName,
      dtNascimento: birthDate,
      telefone: phone,
      email,
      senha: hashedPassword,
      tipoUsuario: userType
    });
    const token = jwt.sign(
      { id: id, email, tipoUsuario: userType },
      SECRET,
      { expiresIn: '1d' }
    );
    res.json({ token, id: id });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
  }
};