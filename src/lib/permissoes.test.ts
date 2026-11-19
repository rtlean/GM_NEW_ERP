import { describe, expect, it } from "vitest";
import { MENU } from "./menu";
import {
  menuPermitido,
  podeAbrirTela,
  podeEntrar,
  precisaTrocarSenha,
  primeiraRotaPermitida,
  sessaoValida,
  TELAS_LIBERAVEIS,
  type PerfilAcesso,
} from "./permissoes";

const admin: PerfilAcesso = { role: "admin", status: "active", telas: [] };
const operacional: PerfilAcesso = { role: "user", status: "active", telas: ["locadores", "contratos"] };
const bloqueado: PerfilAcesso = { role: "user", status: "inactive", telas: ["locadores"] };

describe("podeEntrar", () => {
  it("bloqueia conta inativa", () => {
    expect(podeEntrar(bloqueado)).toBe(false);
    expect(podeEntrar(operacional)).toBe(true);
  });
});

describe("podeAbrirTela", () => {
  it("admin abre todas as telas", () => {
    expect(podeAbrirTela(admin, "usuarios")).toBe(true);
    expect(podeAbrirTela(admin, "relatorio")).toBe(true);
  });

  it("operacional abre só as telas liberadas", () => {
    expect(podeAbrirTela(operacional, "locadores")).toBe(true);
    expect(podeAbrirTela(operacional, "lancamentos")).toBe(false);
  });

  it("operacional nunca abre Usuários, mesmo se estiver na lista de telas", () => {
    const comUsuarios: PerfilAcesso = { role: "user", status: "active", telas: ["usuarios"] };
    expect(podeAbrirTela(comUsuarios, "usuarios")).toBe(false);
  });

  it("conta bloqueada não abre nenhuma tela, nem sendo admin", () => {
    expect(podeAbrirTela(bloqueado, "locadores")).toBe(false);
    expect(podeAbrirTela({ ...admin, status: "inactive" }, "dashboard")).toBe(false);
  });

  it("sem perfil não abre nada", () => {
    expect(podeAbrirTela(null, "dashboard")).toBe(false);
  });
});

describe("menuPermitido", () => {
  it("admin vê o menu completo", () => {
    expect(menuPermitido(admin)).toEqual(MENU);
  });

  it("operacional vê só as telas liberadas e grupos vazios somem", () => {
    const rotas = menuPermitido(operacional).flatMap((g) => g.itens.map((i) => i.rota));
    expect(rotas).toEqual(["contratos", "locadores"]);
    expect(menuPermitido(operacional).map((g) => g.rotulo)).toEqual(["Locação"]);
  });

  it("sem perfil não mostra menu", () => {
    expect(menuPermitido(null)).toEqual([]);
  });
});

describe("primeiraRotaPermitida", () => {
  it("escolhe a primeira tela liberada para o login", () => {
    expect(primeiraRotaPermitida(operacional)?.rota).toBe("contratos");
    expect(primeiraRotaPermitida({ ...operacional, telas: [] })).toBeUndefined();
  });
});

describe("sessaoValida", () => {
  it("vale quando nunca houve redefinição ou bloqueio", () => {
    expect(sessaoValida({ sessoesInvalidadasEm: null }, null)).toBe(true);
  });

  it("deixa de valer para sessões emitidas antes da invalidação", () => {
    const corte = "2026-11-19T12:00:00.000Z";
    const antes = Date.parse("2026-11-19T11:00:00.000Z") / 1000;
    const depois = Date.parse("2026-11-19T13:00:00.000Z") / 1000;
    expect(sessaoValida({ sessoesInvalidadasEm: corte }, antes)).toBe(false);
    expect(sessaoValida({ sessoesInvalidadasEm: corte }, depois)).toBe(true);
  });
});

describe("precisaTrocarSenha", () => {
  it("só vale quando marcado", () => {
    expect(precisaTrocarSenha({ trocarSenha: true })).toBe(true);
    expect(precisaTrocarSenha({})).toBe(false);
  });
});

describe("TELAS_LIBERAVEIS", () => {
  it("não inclui a tela exclusiva do admin", () => {
    expect(TELAS_LIBERAVEIS).not.toContain("usuarios");
    expect(TELAS_LIBERAVEIS).toContain("sicredi");
  });
});
