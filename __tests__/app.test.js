import request from 'supertest';
import app from '../src/index.js';
import admin from '../firebase.js';

describe('API Auth', () => {
  it('deve responder com erro se faltar email ou senha no login', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('deve responder com erro se o usuário não existir', async() => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'naoexiste@teste.com',
      password: 'senhaerrada'
    });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('deve cadastrar um novo usuário', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      id: 'testuserid',
      name: 'Teste',
      lastName: 'User',
      birthDate: '2000-01-01',
      phone: '11999999999',
      email: 'testuser14@teste.com',
      password: 'senha123',
      userType: 'consumidor'
    });
    expect([200, 400]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('token');
  });

  it('dev recusar cadastro com email já existente', async () => {
    await request(app).post('/api/auth/signup').send({
      id: 'testuserid2',
      name: 'Teste',
      lastName: 'User',
      birthDate: '2000-01-01',
      phone: '11999999999',
      email: 'testuser6@teste.com',
      password: 'senha123',
      userType: 'consumidor'
    });
    const res = await request(app).post('/api/auth/signup').send({
      id: 'testuserid3',
      name: 'Teste',
      lastName: 'User',
      birthDate: '2000-01-01',
      phone: '11999999999',
      email: 'testuser6@teste.com',
      password: 'senha123',
      userType: 'consumidor'
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('Rotas protegidas', () => {
  let token;

  beforeAll(async () => {
    await request(app).post('/api/auth/signup').send({
      id: 'protecteduserid',
      name: 'Protegido',
      lastName: 'User',
      birthDate: '2000-01-01',
      phone: '11999999999',
      email: 'protegido@teste.com',
      password: 'senha123',
      userType: 'consumidor'
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'protegido@teste.com',
      password: 'senha123'
    });
    token = res.body.token;
  });

  it('deve bloquear acesso sem token', async () => {
    const res = await request(app).get('/api/sync/syncFromServer/usuarios');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('deve permitir acesso com token válido', async () => {
    const res = await request(app)
      .get('/api/sync/syncFromServer/usuarios')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 400]).toContain(res.statusCode);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('deve bloquear acesso com token inválido', async () => {
    const res = await request(app)
      .get('/api/sync/syncFromServer/usuarios')
      .set('Authorization', 'Bearer token_invalido');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('deve permitir POST com token válido', async () => {
    const res = await request(app)
      .post('/api/sync/syncToServer')
      .set('Authorization', `Bearer ${token}`)
      .send({tableName: 'usuarios', data:[
        { 
          id: 'novoId', 
          pNome: 'Novo Usuário',
          email:'email@teste.com',
          senha:'123senha',
          sobrenome:'user',
          telefone:'(38)99229-7372',
          tipoUsuario:'consumidor'
        }]});
    expect([200, 201, 400]).toContain(res.statusCode);
  });

  it('deve bloquear DELETE sem token', async () => {
    const res = await request(app)
      .delete('/api/sync/deleteFromServer/usuarios?id=protecteduserid');
    expect(res.statusCode).toBe(401);
  });

  it('deve salvar usuário no Firestore', async ()=> {
    const doc = await admin.firestore().collection('usuarios').doc('protecteduserid').get();
    expect(doc.exists).toBe(true);
    expect(doc.data().email).toBe('protegido@teste.com');
  });

  it('deve autenticar com dados reais',async() => {
    const res = await request(app).post('/api/auth/login').send({
      email:'protegido@teste.com',
      password: 'senha123'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('deve atualizar um usuário existente', async () => {
    const res = await request(app)
      .post('/api/sync/syncToServer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tableName: 'usuarios',
        data: [{ 
          id: 'protecteduserid', 
          pNome: 'Novo Nome', 
          email: 'protegido@teste.com',
          senha: '$2b$10$kXP5xwi22cgyzsx9sDNnDOm6fpsWV37/pzUWyVPhzbGt7QSB8Jl3i',
          sobrenome:'User',
          dtNascimento:'2000-01-01',
          telefone:'11999999999',
          tipoUsusario:'consumidor',
        }]
      });
    expect([200, 201, 400]).toContain(res.statusCode);

    const doc = await admin.firestore().collection('usuarios').doc('protecteduserid').get();
    expect(doc.exists).toBe(true);
    expect(doc.data().pNome).toBe('Novo Nome');
  });

  it('deve buscar usuário por múltiplos filtros', async () => {
    const res = await request(app)
    .get('/api/sync/syncFromServer/usuarios?filters=email,==,protegido@teste.com;pNome,==,Novo Nome')
    .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].email).toBe('protegido@teste.com');
    expect(res.body[0].pNome).toBe('Novo Nome');
  });
});