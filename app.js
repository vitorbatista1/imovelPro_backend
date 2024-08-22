// app.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');


// Numero de rounds de salt para o bcrypt
const saltRounds = 10;

// Configuração do banco de dados
const sequelize = new Sequelize('gerenciamento_propriedades', 'postgres', 'admin', {
  host: '127.0.0.1',
  dialect: 'postgres'
});

// Definição do modelo Usuario
const Usuario = sequelize.define('Usuarios', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notNull: { msg: 'O campo email é obrigatório' },
      isEmail: { msg: 'O campo email deve ser um endereço de email válido' }
    }
  },



  senha: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: 'O campo senha é obrigatório' },
      len: [6, 100]
    }
  }
},{
  timestamps: true
}
);

// Definição do modelo Propriedade
const Propriedade = sequelize.define('propriedades', {
  endereco: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fotos: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Usuario,
      key: 'id'
    }
  }
});

//Função para criptografar a senha 

async function hashPassword(senha) {

  try{
    const hash = await bcrypt.hash(senha, saltRounds);
    return hash;
  } catch(error){
    console.error('erro ao criptografar asenha', error);
    throw error;
  }
  
}

// Middleware de autenticação
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  jwt.verify(token, 'seu_segredo', (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.userId = decoded.id;
    next();
  });
};

// Inicializa o aplicativo Express
const app = express();
app.use(cors())
app.use(bodyParser.json());

// Rota create User

app.post('/createUser', async (req, res) => {
  const {nome, email, senha} = req.body;

  try {
    const senhaCriptografada = await hashPassword(senha);

    const verifyEmail = await Usuario.findOne({where: {email}})

    if (verifyEmail){
      return res.status(401).json({error: 'Email já cadastrado'});
    }

    await Usuario.create({
      nome,
      email,
      senha: senhaCriptografada
    });
    console.log("Usuario criado com sucesso!");
    res.json({ nome, email});
  } catch(error){
    console.error('erro ao crair usuario', error);
  }
});





// Rota Trocar senha
// app.update('/trocarSenha', async (req,res) => {
//   const {email, senha } = req.body;



// });


// Rota de login
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;


  console.log(email)
  console.log(senha)

  try {
    const usuario = await Usuario.findOne({ where: { email } });
    console.log(usuario)

    if (!usuario) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const comparacionPassword = await bcrypt.compare(senha, usuario.senha);
    if (!comparacionPassword) {
      return res.status(401).json({ error: 'Senha inválida' });
    }

    const token = jwt.sign({ id: usuario.id }, 'seu_segredo', { expiresIn: '1h' });

    console.log('Token gerado:', token);
    res.json({ token, nome: usuario.nome});
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para listar propriedades
app.get('/propriedades', authMiddleware, async (req, res) => {
  try {
    console.log(req.userId)
    const propriedades = await Propriedade.findAll({
      
      where: { userId: req.userId }
    
    });
    res.json(propriedades);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});











// Inicializa o servidor
app.listen(3000, async () => {
  console.log('Servidor rodando na porta 3000');
  try {
    await sequelize.authenticate();
  } catch (error) {
    console.error('Não foi possível conectar ao banco de dados:', error);
  }
});
