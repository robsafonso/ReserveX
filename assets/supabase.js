/* ============================================
   ReserveX - Configuração Supabase
   Cliente: Jimmy's Bar
   ============================================ */

const SUPABASE_URL = 'https://rpgvkydxwhkuuabcgfmb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KbdTofsN0EE233vLxestOg_Gzu_nkjf';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================================================
// AUTH HELPERS
// =====================================================

function getAdminLogado() {
  const raw = sessionStorage.getItem('rx_admin');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setAdminLogado(admin) {
  sessionStorage.setItem('rx_admin', JSON.stringify(admin));
}

function logout() {
  sessionStorage.removeItem('rx_admin');
  window.location.href = 'login.html';
}

function exigirLogin() {
  const admin = getAdminLogado();
  if (!admin) {
    window.location.href = 'login.html';
    return null;
  }
  return admin;
}

// =====================================================
// LOGIN
// =====================================================

async function fazerLogin(usuario, senha) {
  const { data, error } = await sb
    .from('admins')
    .select('id, nome, usuario, nivel, ativo, tenant_id')
    .eq('tenant_id', TENANT_ID)
    .eq('usuario', usuario)
    .eq('ativo', true)
    .maybeSingle();
  
  if (error) throw new Error('Erro ao consultar usuário: ' + error.message);
  if (!data) throw new Error('Usuário ou senha inválidos.');
  
  const { data: ok, error: errSenha } = await sb.rpc('validar_senha_admin', {
    p_usuario: usuario,
    p_senha: senha,
    p_tenant_id: TENANT_ID
  });
  
  if (errSenha) throw new Error('Erro de validação: ' + errSenha.message);
  if (!ok) throw new Error('Usuário ou senha inválidos.');
  
  await sb.from('admins').update({ ultimo_login: new Date().toISOString() }).eq('id', data.id);
  
  const adminSession = {
    id: data.id,
    nome: data.nome,
    usuario: data.usuario,
    nivel: data.nivel,
    tenant_id: data.tenant_id
  };
  setAdminLogado(adminSession);
  return adminSession;
}

// =====================================================
// HELPERS DE DATA (sem bug de timezone)
// =====================================================

function hojeISO() {
  // Retorna YYYY-MM-DD da data LOCAL (sem timezone bug)
  var d = new Date();
  var ano = d.getFullYear();
  var mes = String(d.getMonth() + 1).padStart(2, '0');
  var dia = String(d.getDate()).padStart(2, '0');
  return ano + '-' + mes + '-' + dia;
}

function diaSemanaPT(dataISO) {
  if (!dataISO || !/^\d{4}-\d{2}-\d{2}$/.test(dataISO)) return '';
  var p = dataISO.split('-');
  var d = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
  var dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  return dias[d.getDay()];
}

function fmtData(data) {
  if (!data) return '-';
  // Trata data ISO pura (YYYY-MM-DD) como local pra evitar bug de timezone
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    var p = data.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }
  var d = new Date(data);
  return d.toLocaleDateString('pt-BR');
}

function fmtDataHora(data) {
  if (!data) return '-';
  const d = new Date(data);
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function fmtTelefone(tel) {
  if (!tel) return '';
  const digits = tel.replace(/\D/g, '');
  if (digits.length === 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
  return tel;
}

function gerarToken(tamanho = 16) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < tamanho; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// IMPORTANTE iOS: copiar deve ser SÍNCRONO (sem await antes)
function copiarTexto(texto, btnEl) {
  navigator.clipboard.writeText(texto);
  
  if (btnEl) {
    const original = btnEl.textContent;
    btnEl.textContent = '✓ Copiado!';
    btnEl.classList.add('btn-success');
    setTimeout(() => {
      btnEl.textContent = original;
      btnEl.classList.remove('btn-success');
    }, 1500);
  }
}

// Toast
function toast(mensagem, tipo = 'info') {
  const div = document.createElement('div');
  div.className = `alert alert-${tipo} fade-in`;
  div.style.cssText = `
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    z-index: 9999; min-width: 280px; max-width: 90vw; box-shadow: var(--shadow-lg);
  `;
  div.textContent = mensagem;
  document.body.appendChild(div);
  setTimeout(() => {
    div.style.opacity = '0';
    setTimeout(() => div.remove(), 300);
  }, 3000);
}
