// app.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

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
      len: [6, 100] // Senha deve ter entre 6 e 100 caracteres
    }
  }
});

// Definição do modelo Propriedade
const Propriedade = sequelize.define('Propriedade', {
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

// Rota de login
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Senha inválida' });
    }

    const token = jwt.sign({ id: usuario.id }, 'seu_segredo', { expiresIn: '1h' });
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
