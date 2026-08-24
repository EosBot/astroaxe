"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AstroAxeLogo } from "./astroaxe-logo";
import { AmbientSoundControl } from "./ambient-sound-control";

const links = [
  { href: "/", label: "Início" },
  { href: "/conta", label: "Meu céu" },
  { href: "/conta#configuracoes", label: "Configurações" },
  { href: "/acervo-cultural", label: "Acervo" },
  { href: "/metodologia", label: "Método" },
] as const;

export function SiteHeader(): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean>();

  useEffect(() => {
    void fetch("/api/auth/status")
      .then(async (response) => {
        const body: unknown = await response.json();
        setAuthenticated(
          response.ok &&
            typeof body === "object" &&
            body !== null &&
            "authenticated" in body &&
            body.authenticated === true,
        );
      })
      .catch(() => setAuthenticated(false));
  }, [pathname]);

  async function logout(): Promise<void> {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthenticated(false);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <AstroAxeLogo />
        <div className="site-header-actions">
          <AmbientSoundControl />
          <button
            className="site-menu-toggle"
            type="button"
            aria-expanded={open}
            aria-controls="site-navigation"
            onClick={() => setOpen((current) => !current)}
          >
            <span aria-hidden="true">{open ? "×" : "☰"}</span>
            <span className="sr-only">{open ? "Fechar menu" : "Abrir menu"}</span>
          </button>
        </div>
        <nav
          id="site-navigation"
          className="site-navigation"
          data-open={open}
          aria-label="Principal"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {authenticated ? (
            <button className="site-session-action" type="button" onClick={() => void logout()}>
              Sair
            </button>
          ) : (
            <Link className="site-session-action" href="/entrar" onClick={() => setOpen(false)}>
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
