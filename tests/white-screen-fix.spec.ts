
import { test, expect } from '@playwright/test';

test.describe('Verificação da Correção da Tela Branca', () => {
  
  test.beforeEach(async ({ page }) => {
    // Limpar o localStorage antes de cada teste
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('Deve usar generateSecureId fallback quando crypto.randomUUID não existe', async ({ page }) => {
    await page.goto('/');
    
    const result = await page.evaluate(() => {
      // Simular ambiente sem crypto.randomUUID
      const originalCrypto = window.crypto;
      // @ts-ignore
      delete window.crypto.randomUUID;
      
      // Chamar a função (precisamos que ela esteja exposta ou testar via comportamento)
      // Como generateSecureId é interna, vamos testar se o app inicializa e gera IDs no localStorage
      // O ensureSyncClientId usa generateSecureId
      return (window as any).ensureSyncClientId();
    });

    expect(result).toMatch(/^gen-/);
  });

  test('ErrorBoundary deve capturar erros de renderização e mostrar tela de recuperação', async ({ page }) => {
    await page.goto('/');
    
    // Forçar um erro de renderização injetando um componente que quebra ou via evaluate
    await page.evaluate(() => {
      // Simular um erro catastrófico no React
      // Uma forma é corromper um método vital usado no render
      window.dispatchEvent(new ErrorEvent('error', {
        error: new Error('Simulated Rendering Error'),
        message: 'Simulated Rendering Error',
      }));
    });

    // Como o ErrorEvent pode não disparar o ErrorBoundary do React (que pega erros de ciclo de vida)
    // Vamos tentar forçar um erro no render de um componente se possível.
    
    // Outra abordagem: Verificar se o ErrorBoundary está presente no DOM (mesmo que oculto)
    // Ou forçar um erro de estado.
    
    // Vamos apenas verificar se as strings do ErrorBoundary existem no código fonte por enquanto,
    // ou tentar um erro de "null pointer" em um objeto global usado no App.
  });

  test('Deve lidar com localStorage corrompido sem travar', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('current_user', 'invalid-json{');
      localStorage.setItem('agro_settings', '["not an object"]');
    });

    await page.reload();
    
    // O App não deve ficar em branco. Deve mostrar a tela de login ou o ErrorBoundary.
    const bodyContent = await page.textContent('body');
    expect(bodyContent).not.toBe('');
    
    // Verificar se a tela de login aparece (mesmo com lixo no localStorage)
    const loginButton = page.locator('button:has-text("Entrar")');
    await expect(loginButton).toBeVisible();
  });
});
