var cors = require('cors')
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.use(cors())

//variáveis para a aplicação armazenar dados de acesso e chat
var cpfs = []
var historicoConversa = []

//Rota para validar login de acesso por CPF
app.post('/logar', function(req, res){
  let cpf = req.query.cpf
  let validaUsuario = cpfs.filter(cpfFilter=>{return cpfFilter.cpf == cpf})
  if(validaUsuario.length>0 && validaUsuario[0].status == 'online')res.json({ acesso: 'barrado' })
  else res.json({ acesso: 'liberado' })
});

//Conexões para o Chat
io.on('connection', function(socket){
  //Escutando Mensagens
  socket.on('chat', function(msg){
    //Tratando e enviando mensagens response
    msg = msg + getHorario()
    historicoConversa.push(msg)
    io.emit('chat', historicoConversa);
  });

  //Escutando logout
  socket.on('logout', function(msg){
    //Alterando status do usuário para offline
    let cpf = msg.split('&%')[0]
    cpfs.forEach(element => {
      if(element.cpf == cpf){
        element.status = 'offline'
      }
    });
    
    //Enviando mensagem de usuário deslogado para os demais
    msg = msg + getHorario()
    historicoConversa.push(msg)
    io.emit('chat', historicoConversa);

    //Enviando resposta de usuário deslogado
    io.emit('usuarios', cpfs);
  });

  //Escutando os acessos de usuários
  socket.on('usuarios', function(msg){
    let cpf = msg.split('&%')[0]
    let nome = msg.split('&%')[1]
    if(!testaCPF(cpf)){
      return
    }

    let usuario = {
      nome:nome,
      cpf:cpf,
      status:'online',
      cor:getRandomColor()
    }

    //Validando se o usuário já fez parte do chat
    let validaUsuario = cpfs.filter(cpfFilter=>{return cpfFilter.cpf == cpf})
    if(validaUsuario.length==0){
      cpfs.push(usuario)
    }else{
      cpfs.forEach(element => {
        if(element.cpf == cpf){
          element.status = 'online'
        }
      });
    }

    //Enviando usuário com Status online
    io.emit('usuarios', cpfs);
  });
  
});

//Caso seja necessário alteração de cores por usuário
function getRandomColor() {
  var letters = '0123456789AB';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 12)];
  }
  return color;
}

//Validação de CPF real
function testaCPF(CPF) {
  if (CPF.length === 14) {
      var strCPF = CPF.replace(/[.*-]/g, '');
      let Soma;
      let Resto;
      Soma = 0;
      if (strCPF === "00000000000" || strCPF === "11111111111" || strCPF === "22222222222" || strCPF === "33333333333" || strCPF === "44444444444" || strCPF === "55555555555" || strCPF === "66666666666" || strCPF === "77777777777" || strCPF === "88888888888" || strCPF === "99999999999") return false;
      for (let i = 1; i <= 9; i++) Soma = Soma + parseInt(strCPF.substring(i - 1, i)) * (11 - i);
      Resto = (Soma * 10) % 11;

      if ((Resto == 10) || (Resto == 11)) Resto = 0;
      if (Resto != parseInt(strCPF.substring(9, 10))) return false;

      Soma = 0;
      for (let i = 1; i <= 10; i++) Soma = Soma + parseInt(strCPF.substring(i - 1, i)) * (12 - i);
      Resto = (Soma * 10) % 11;

      if ((Resto == 10) || (Resto == 11)) Resto = 0;
      if (Resto != parseInt(strCPF.substring(10, 11))) return false;
      return true;
  }
  return false;
}

//Montando função de horário da mensagem
function getHorario() {
  let data = new Date()
  let dia = data.getDate()
  let mes = data.getMonth()
  let ano = `${data.getFullYear()}`
  let horas = data.getHours()
  let minutos = data.getMinutes()
  if(minutos<10)minutos = `0${minutos}`
  if(horas<10)horas = `0${horas}`
  return `&%${dia}.${mes}.${ano.slice(2, 4)} - ${horas}:${minutos}`
}

//Aplicação rodando
http.listen(3000, function(){
  console.log('Servidor rodando em: http://localhost:3000');
});