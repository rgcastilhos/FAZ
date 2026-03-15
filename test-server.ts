import axios from 'axios';

async function testServer() {
  const url = 'http://localhost:3000';
  console.log(`Testando servidor em ${url}...`);
  try {
    const health = await axios.get(`${url}/api/health`);
    console.log('Health Check OK:', health.data);

    const version = await axios.get(`${url}/api/version`);
    console.log('Version Check OK:', version.data);

    try {
      await axios.post(`${url}/api/auth/login`, { username: 'test', password: 'test' });
    } catch (e: any) {
      console.log('Login Endpoint Respondendo (Erro esperado 401/400):', e.response?.status);
    }
    
    console.log('--- TESTE CONCLUÍDO COM SUCESSO ---');
  } catch (error: any) {
    console.error('Falha ao conectar ao servidor:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('O servidor não está rodando na porta 3000.');
    }
  }
}

testServer();
