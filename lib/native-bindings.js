(() => {
  function createFallbackBindings(R) {
    const h = R?.createElement ? R.createElement.bind(R) : () => null;
    const createPortal = (node, container) =>
      typeof globalThis.ReactDOM?.createPortal === 'function' && container
        ? globalThis.ReactDOM.createPortal(node, container)
        : node;

    let styleMounted = false;
    function ensureFallbackStyles() {
      if (styleMounted || typeof document === 'undefined' || !document.head || typeof document.createElement !== 'function') return;
      if (document.querySelector?.('style[data-agy-fallback-ui]')) { styleMounted = true; return; }
      const st = document.createElement('style');
      st.dataset.agyFallbackUi = '';
      st.textContent = `
        .agy-fb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:8px;font:inherit;font-size:13px;font-weight:500;line-height:1.2;cursor:pointer;user-select:none;white-space:nowrap;transition:background 120ms ease,color 120ms ease,border-color 120ms ease,opacity 120ms ease;border:1px solid transparent;background:transparent;color:var(--foreground)}
        .agy-fb-btn:disabled{opacity:.48;cursor:not-allowed;pointer-events:none}
        .agy-fb-btn:focus-visible{outline:2px solid var(--primary,#2563eb);outline-offset:1px}
        .agy-fb-btn[data-variant="ghost"]{background:transparent;color:var(--secondary-foreground,var(--foreground))}
        .agy-fb-btn[data-variant="ghost"]:hover{background:var(--secondary,rgba(127,127,127,.14));color:var(--foreground)}
        .agy-fb-btn[data-variant="secondary"]{background:var(--secondary,rgba(127,127,127,.14));border-color:var(--border,rgba(127,127,127,.22));color:var(--foreground)}
        .agy-fb-btn[data-variant="secondary"]:hover{opacity:.9}
        .agy-fb-btn[data-variant="primary"]{background:var(--primary,#2563eb);color:var(--primary-foreground,#fff)}
        .agy-fb-btn[data-variant="primary"]:hover{opacity:.92}
        .agy-fb-btn[data-variant="destructive"]{background:var(--error,#dc2626);color:#fff}
        .agy-fb-btn[data-size="icon"]{width:28px;height:28px;padding:0;border-radius:7px}
        .agy-fb-btn[data-size="icon-lg"]{width:32px;height:32px;padding:0;border-radius:9999px}
        .agy-fb-btn[data-size="xs"]{height:24px;padding:0 8px;font-size:12px;border-radius:6px}
        .agy-fb-btn[data-size="sm"]{height:28px;padding:0 10px;font-size:12.5px;border-radius:7px}
        .agy-fb-btn[data-size="md"]{height:34px;padding:0 14px;font-size:13px}
        .agy-fb-pop{position:fixed;z-index:9500;min-width:160px;padding:6px;border-radius:11px;border:1px solid var(--border,rgba(127,127,127,.24));background:var(--card,var(--background,#1e1e1e));color:var(--foreground);box-shadow:0 12px 32px rgba(0,0,0,.24),0 2px 8px rgba(0,0,0,.1);outline:none}
        .agy-fb-menu-item{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;padding:6px 10px;border:0;border-radius:7px;background:transparent;color:var(--foreground);font:inherit;font-size:13px;line-height:18px;text-align:left;cursor:pointer}
        .agy-fb-menu-item:hover,.agy-fb-menu-item:focus-visible{background:var(--secondary,rgba(127,127,127,.16));outline:none}
        .agy-fb-menu-item:disabled{opacity:.45;cursor:not-allowed}
        .agy-fb-switch{position:relative;display:inline-flex;align-items:center;width:36px;height:20px;padding:2px;border-radius:9999px;border:1px solid var(--border,rgba(127,127,127,.28));background:var(--secondary,rgba(127,127,127,.22));cursor:pointer;flex-shrink:0;transition:background 140ms ease,border-color 140ms ease}
        .agy-fb-switch[aria-checked="true"]{background:var(--primary,#2563eb);border-color:var(--primary,#2563eb)}
        .agy-fb-switch:disabled{opacity:.45;cursor:not-allowed}
        .agy-fb-switch-thumb{width:14px;height:14px;border-radius:9999px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.22);transform:translateX(0);transition:transform 140ms ease}
        .agy-fb-switch[aria-checked="true"] .agy-fb-switch-thumb{transform:translateX(16px)}
        .agy-fb-card{border-radius:12px;border:1px solid var(--border,rgba(127,127,127,.22));background:var(--card,transparent);overflow:hidden}
        .agy-fb-card > * + *{border-top:1px solid var(--border,rgba(127,127,127,.18))}
        .agy-fb-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 16px;min-width:0}
        .agy-fb-toast-stack{position:fixed;right:18px;bottom:18px;z-index:9900;display:flex;flex-direction:column;gap:8px;pointer-events:none;max-width:min(360px,calc(100vw - 36px))}
        .agy-fb-toast{pointer-events:auto;padding:10px 13px;border-radius:10px;border:1px solid var(--border,rgba(127,127,127,.26));background:var(--card,var(--background,#1f2328));color:var(--foreground,#fff);box-shadow:0 10px 26px rgba(0,0,0,.24);font-size:12.5px;line-height:1.45}
      `;
      document.head.append(st);
      styleMounted = true;
    }

    function computeFloatingPosition(anchorRect, popEl, placement = 'bottom-start', matchWidth = false) {
      const vw = Math.max(240, Number(globalThis.innerWidth) || document?.documentElement?.clientWidth || 1280);
      const vh = Math.max(180, Number(globalThis.innerHeight) || document?.documentElement?.clientHeight || 800);
      const pr = popEl?.getBoundingClientRect?.() || { width: 220, height: 160 };
      const pw = matchWidth && anchorRect.width > 0 ? anchorRect.width : Math.max(80, pr.width || 220);
      const ph = Math.max(28, pr.height || 120);
      const gap = 6, pad = 8;
      const [side, align = 'center'] = String(placement || 'bottom-start').split('-');
      let left = anchorRect.left;
      let top = anchorRect.bottom + gap;
      if (side === 'top') {
        top = anchorRect.top - ph - gap;
        if (top < pad && anchorRect.bottom + ph + gap <= vh - pad) top = anchorRect.bottom + gap;
      } else if (side === 'left') {
        left = anchorRect.left - pw - gap;
        top = align === 'start' ? anchorRect.top : align === 'end' ? anchorRect.bottom - ph : anchorRect.top + (anchorRect.height - ph) / 2;
        if (left < pad && anchorRect.right + pw + gap <= vw - pad) left = anchorRect.right + gap;
      } else if (side === 'right') {
        left = anchorRect.right + gap;
        top = align === 'start' ? anchorRect.top : align === 'end' ? anchorRect.bottom - ph : anchorRect.top + (anchorRect.height - ph) / 2;
        if (left + pw > vw - pad && anchorRect.left - pw - gap >= pad) left = anchorRect.left - pw - gap;
      } else {
        top = anchorRect.bottom + gap;
        if (top + ph > vh - pad && anchorRect.top - ph - gap >= pad) top = anchorRect.top - ph - gap;
      }
      if (side === 'top' || side === 'bottom') {
        if (align === 'end') left = anchorRect.right - pw;
        else if (align !== 'start') left = anchorRect.left + (anchorRect.width - pw) / 2;
      }
      left = Math.max(pad, Math.min(vw - pw - pad, left));
      top = Math.max(pad, Math.min(vh - ph - pad, top));
      return { left: Math.round(left), top: Math.round(top), width: matchWidth && anchorRect.width > 0 ? Math.round(anchorRect.width) : undefined };
    }

    function extractVirtualAnchorRect(triggerEl) {
      if (!triggerEl) return null;
      if (typeof triggerEl.getBoundingClientRect === 'function') {
        const r = triggerEl.getBoundingClientRect();
        if (r && (r.width > 0 || r.height > 0 || r.left !== 0 || r.top !== 0)) return r;
      }
      const st = triggerEl.style;
      if (st && st.position === 'fixed') {
        const x = parseFloat(st.left) || 0;
        const y = parseFloat(st.top) || 0;
        return { left: x, right: x + 1, top: y, bottom: y + 1, width: 1, height: 1 };
      }
      return { left: 16, right: 48, top: 16, bottom: 44, width: 32, height: 28 };
    }

    const PopCtx = R?.createContext ? R.createContext(null) : null;

    function FallbackHC({ open: controlledOpen, defaultOpen = false, onOpenChange, placement = 'bottom-start', matchTriggerWidth = false, children }) {
      ensureFallbackStyles();
      const [uncontrolledOpen, setUncontrolledOpen] = R.useState ? R.useState(Boolean(defaultOpen)) : [Boolean(defaultOpen), () => {}];
      const isControlled = controlledOpen !== undefined;
      const isOpen = isControlled ? Boolean(controlledOpen) : uncontrolledOpen;
      const triggerRef = R.useRef ? R.useRef(null) : { current: null };
      const contentRef = R.useRef ? R.useRef(null) : { current: null };
      const setOpen = (next, details) => {
        const val = Boolean(next);
        let cancelled = false;
        onOpenChange?.(val, { ...(details || {}), cancel() { cancelled = true; } });
        if (!cancelled && !isControlled) setUncontrolledOpen(val);
      };
      if (!PopCtx) return h(R.Fragment || 'div', null, children);
      return h(PopCtx.Provider, { value: { open: isOpen, setOpen, placement, matchTriggerWidth, triggerRef, contentRef } }, children);
    }

    function FallbackIC({ asChild, children, ...rest }) {
      const ctx = R.useContext ? R.useContext(PopCtx) : null;
      const attachRef = node => {
        if (ctx?.triggerRef) ctx.triggerRef.current = node;
        const childRef = children?.ref;
        if (typeof childRef === 'function') childRef(node);
        else if (childRef && typeof childRef === 'object') childRef.current = node;
      };
      if (asChild && children && typeof children === 'object' && 'props' in children) {
        const origClick = children.props?.onClick;
        const isVirtualFixed = children.props?.style?.position === 'fixed' && children.props?.style?.pointerEvents === 'none';
        const nextProps = {
          ...rest,
          ref: attachRef,
          'aria-expanded': isVirtualFixed ? undefined : Boolean(ctx?.open),
          onClick: isVirtualFixed ? origClick : event => {
            origClick?.(event);
            if (!event?.defaultPrevented) ctx?.setOpen(!ctx.open, { event });
          }
        };
        return R.isValidElement?.(children) && R.cloneElement
          ? R.cloneElement(children, nextProps)
          : { ...children, props: { ...children.props, ...nextProps } };
      }
      return h('button', {
        type: 'button',
        ...rest,
        ref: attachRef,
        'aria-expanded': Boolean(ctx?.open),
        onClick: event => {
          rest.onClick?.(event);
          if (!event?.defaultPrevented) ctx?.setOpen(!ctx.open, { event });
        }
      }, children);
    }

    function FallbackJC({ className = '', style, arrowNavigable, role = 'dialog', children, ...rest }) {
      const ctx = R.useContext ? R.useContext(PopCtx) : null;
      const [pos, setPos] = R.useState ? R.useState(null) : [null, () => {}];
      const useIsoLayout = R.useLayoutEffect || R.useEffect;
      useIsoLayout?.(() => {
        if (!ctx?.open || typeof document === 'undefined') return;
        const update = () => {
          const rect = extractVirtualAnchorRect(ctx.triggerRef?.current);
          if (!rect || !ctx.contentRef?.current) return;
          setPos(computeFloatingPosition(rect, ctx.contentRef.current, ctx.placement, ctx.matchTriggerWidth));
        };
        update();
        const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(update) : 0;
        const onDown = event => {
          const t = event?.target;
          if (!t) return;
          if (ctx.contentRef?.current?.contains?.(t) || ctx.triggerRef?.current?.contains?.(t)) return;
          if (t.closest?.('[data-agy-powertools-root="file-menu-sub"]')) return;
          ctx.setOpen(false, { event });
        };
        const onKey = event => {
          if (event?.key === 'Escape') {
            event.stopPropagation?.();
            ctx.setOpen(false, { event });
          } else if (arrowNavigable && (event?.key === 'ArrowDown' || event?.key === 'ArrowUp') && ctx.contentRef?.current) {
            const items = [...(ctx.contentRef.current.querySelectorAll?.('button:not(:disabled),[role="menuitem"]:not([disabled]),[role="option"]:not([disabled])') || [])];
            if (!items.length) return;
            event.preventDefault?.();
            const idx = items.indexOf(document.activeElement);
            const next = event.key === 'ArrowDown' ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
            items[next]?.focus?.();
          }
        };
        document.addEventListener?.('pointerdown', onDown, true);
        document.addEventListener?.('keydown', onKey, true);
        globalThis.window?.addEventListener?.('resize', update);
        return () => {
          if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
          document.removeEventListener?.('pointerdown', onDown, true);
          document.removeEventListener?.('keydown', onKey, true);
          globalThis.window?.removeEventListener?.('resize', update);
        };
      }, [ctx?.open, ctx?.placement, ctx?.matchTriggerWidth, arrowNavigable]);

      if (!ctx?.open) return null;
      const popNode = h('div', {
        ...rest,
        role,
        ref: node => { if (ctx.contentRef) ctx.contentRef.current = node; },
        className: `agy-fb-pop ${className}`.trim(),
        style: {
          left: pos ? pos.left : -9999,
          top: pos ? pos.top : -9999,
          ...(pos?.width ? { width: pos.width } : {}),
          ...(style || {})
        }
      }, children);
      return typeof document !== 'undefined' && document.body ? createPortal(popNode, document.body) : popNode;
    }

    function FallbackKC({ asChild, children, ...rest }) {
      const ctx = R.useContext ? R.useContext(PopCtx) : null;
      if (asChild && children && typeof children === 'object' && 'props' in children) {
        const origClick = children.props?.onClick;
        const nextProps = {
          ...rest,
          onClick: event => {
            origClick?.(event);
            ctx?.setOpen(false, { event });
          }
        };
        return R.isValidElement?.(children) && R.cloneElement
          ? R.cloneElement(children, nextProps)
          : { ...children, props: { ...children.props, ...nextProps } };
      }
      return h('button', {
        type: 'button',
        ...rest,
        onClick: event => {
          rest.onClick?.(event);
          ctx?.setOpen(false, { event });
        }
      }, children);
    }

    function FallbackGC({ icon, secondaryAction, className = '', children, onClick, disabled, ...rest }) {
      ensureFallbackStyles();
      return h('button', {
        type: 'button',
        role: 'menuitem',
        disabled,
        ...rest,
        className: `agy-fb-menu-item ${className}`.trim(),
        onClick
      },
        h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 } },
          icon || null,
          h('span', { style: { minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' } }, children)),
        secondaryAction || null);
    }

    function FallbackUy({ variant = 'ghost', size = 'md', tooltip, asChild, className = '', style, children, ...rest }) {
      ensureFallbackStyles();
      const tipProps = tooltip && !rest['data-pt-tip'] ? { 'data-pt-tip': String(tooltip) } : {};
      if (asChild && R.isValidElement?.(children)) {
        return R.cloneElement(children, {
          ...tipProps,
          ...rest,
          className: `agy-fb-btn ${children.props?.className || ''} ${className}`.trim(),
          'data-variant': variant,
          'data-size': size,
          style: { ...(children.props?.style || {}), ...(style || {}) }
        });
      }
      return h('button', {
        type: rest.type || 'button',
        ...tipProps,
        ...rest,
        'data-variant': variant,
        'data-size': size,
        className: `agy-fb-btn ${className}`.trim(),
        style
      }, children);
    }

    function FallbackXP({ checked, onCheckedChange, disabled, className = '', ...rest }) {
      ensureFallbackStyles();
      const isChecked = Boolean(checked);
      return h('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': isChecked,
        disabled,
        ...rest,
        className: `agy-fb-switch ${className}`.trim(),
        onClick: event => {
          rest.onClick?.(event);
          if (!disabled && !event?.defaultPrevented) onCheckedChange?.(!isChecked);
        }
      }, h('span', { className: 'agy-fb-switch-thumb', 'aria-hidden': true }));
    }

    function FallbackTP({ className = '', children, ...rest }) {
      ensureFallbackStyles();
      return h('div', { ...rest, className: `agy-fb-card divide-y divide-border ${className}`.trim() }, children);
    }

    function FallbackUP({ label, description, descriptionId, rightElement, extraContent, className = '', ...rest }) {
      ensureFallbackStyles();
      return h('div', { ...rest, className: `agy-fb-row ${className}`.trim() },
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: 1 } },
          h('div', { style: { fontSize: 13.5, fontWeight: 500, color: 'var(--foreground)', lineHeight: 1.35 } }, label),
          description ? h('div', { id: descriptionId, style: { fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.45 } }, description) : null,
          extraContent || null),
        rightElement ? h('div', { style: { flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 8 } }, rightElement) : null);
    }

    function FallbackVP({ title, headerRight, children, className = '', ...rest }) {
      return h('section', { ...rest, className: `flex flex-col gap-2.5 ${className}`.trim() },
        (title || headerRight) ? h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingInline: 2 } },
          title ? h('h3', { className: 'pt-section-title', style: { margin: 0, fontSize: 14.5, fontWeight: 600 } }, title) : h('span'),
          headerRight || null) : null,
        children);
    }

    function FallbackDq({ name, size = 16, className = '', style, ...rest }) {
      return h('span', {
        'aria-hidden': true,
        ...rest,
        className: `google-symbols select-none inline-flex items-center justify-center shrink-0 ${className}`.trim(),
        style: { fontSize: size, width: size, height: size, lineHeight: 1, ...(style || {}) }
      }, name);
    }

    function FallbackK0({ trigger, defaultExpanded = false, triggerVisible = true, dataTestId, children }) {
      const [expanded, setExpanded] = R.useState ? R.useState(Boolean(defaultExpanded)) : [Boolean(defaultExpanded), () => {}];
      return h('div', { className: 'flex flex-col' },
        triggerVisible !== false ? h('button', {
          type: 'button',
          'aria-expanded': expanded,
          'data-testid': dataTestId,
          onClick: () => setExpanded(prev => !prev),
          style: { display: 'inline-flex', alignItems: 'center', gap: 6, width: '100%', padding: '4px 8px', border: 0, borderRadius: 6, background: 'transparent', color: 'var(--muted-foreground)', font: 'inherit', fontSize: 12.5, textAlign: 'left', cursor: 'pointer' }
        },
          h('span', { 'aria-hidden': true, style: { display: 'inline-block', fontSize: 10, transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 120ms ease' } }, '▸'),
          h('span', { style: { minWidth: 0, flex: 1 } }, trigger)) : null,
        expanded ? h('div', null, children) : null);
    }

    function FallbackSy({ id, place = 'top', children }) {
      const [anchorRect, setAnchorRect] = R.useState ? R.useState(null) : [null, () => {}];
      R.useEffect?.(() => {
        if (!id || typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
        const matchTarget = node => {
          const el = node && typeof node.closest === 'function' ? node : node?.parentElement;
          const found = el?.closest?.('[data-tooltip-id]');
          return found && found.getAttribute?.('data-tooltip-id') === String(id) ? found : null;
        };
        const show = el => {
          const r = el?.getBoundingClientRect?.();
          if (r && (r.width || r.height)) setAnchorRect(r);
        };
        const hide = () => setAnchorRect(null);
        const onOver = e => { const m = matchTarget(e?.target); if (m) show(m); else hide(); };
        const onFocus = e => { const m = matchTarget(e?.target); if (m) show(m); };
        document.addEventListener('pointerover', onOver, true);
        document.addEventListener('focusin', onFocus, true);
        document.addEventListener('focusout', hide, true);
        document.addEventListener('pointerdown', hide, true);
        document.addEventListener('scroll', hide, { capture: true, passive: true });
        return () => {
          document.removeEventListener('pointerover', onOver, true);
          document.removeEventListener('focusin', onFocus, true);
          document.removeEventListener('focusout', hide, true);
          document.removeEventListener('pointerdown', hide, true);
          document.removeEventListener('scroll', hide, { capture: true });
        };
      }, [id]);
      if (!anchorRect || children == null || children === '') return null;
      const tipNode = h('div', {
        role: 'tooltip',
        style: {
          position: 'fixed',
          left: Math.max(8, Math.round(place === 'right' ? anchorRect.right + 8 : anchorRect.left)),
          top: Math.max(8, Math.round(place === 'right' ? anchorRect.top : place === 'bottom' ? anchorRect.bottom + 6 : anchorRect.top - 32)),
          zIndex: 99999,
          maxWidth: 340,
          padding: '6px 9px',
          borderRadius: 8,
          border: '1px solid var(--border,rgba(127,127,127,.26))',
          background: 'var(--card,var(--background,#1f2328))',
          color: 'var(--foreground,#fff)',
          fontSize: 12,
          lineHeight: 1.4,
          pointerEvents: 'none',
          boxShadow: '0 8px 22px rgba(0,0,0,.18)'
        }
      }, children);
      return typeof document !== 'undefined' && document.body ? createPortal(tipNode, document.body) : tipNode;
    }

    const SelCtx = R?.createContext ? R.createContext(null) : null;

    function FallbackKT({ children }) {
      ensureFallbackStyles();
      const [open, setOpen] = R.useState ? R.useState(false) : [false, () => {}];
      const triggerRef = R.useRef ? R.useRef(null) : { current: null };
      const contentRef = R.useRef ? R.useRef(null) : { current: null };
      if (!SelCtx) return h(R.Fragment || 'div', null, children);
      return h(SelCtx.Provider, { value: { open, setOpen, triggerRef, contentRef } }, children);
    }

    function FallbackLT({ asChild, children, ...rest }) {
      const ctx = R.useContext ? R.useContext(SelCtx) : null;
      const attachRef = node => {
        if (ctx?.triggerRef) ctx.triggerRef.current = node;
      };
      if (asChild && R.isValidElement?.(children)) {
        const origClick = children.props?.onClick;
        return R.cloneElement(children, {
          ...rest,
          ref: attachRef,
          'aria-haspopup': 'listbox',
          'aria-expanded': Boolean(ctx?.open),
          onClick: event => {
            origClick?.(event);
            if (!event?.defaultPrevented) ctx?.setOpen(!ctx.open);
          }
        });
      }
      return h('button', { type: 'button', ...rest, ref: attachRef, 'aria-haspopup': 'listbox', 'aria-expanded': Boolean(ctx?.open), onClick: () => ctx?.setOpen(!ctx.open) }, children);
    }

    function FallbackMT({ align = 'end', className = '', children, ...rest }) {
      const ctx = R.useContext ? R.useContext(SelCtx) : null;
      const [pos, setPos] = R.useState ? R.useState(null) : [null, () => {}];
      const useIsoLayout = R.useLayoutEffect || R.useEffect;
      useIsoLayout?.(() => {
        if (!ctx?.open || typeof document === 'undefined') return;
        const update = () => {
          const rect = extractVirtualAnchorRect(ctx.triggerRef?.current);
          if (!rect || !ctx.contentRef?.current) return;
          setPos(computeFloatingPosition(rect, ctx.contentRef.current, align === 'start' ? 'bottom-start' : 'bottom-end', false));
        };
        update();
        const onDown = e => {
          if (ctx.contentRef?.current?.contains?.(e?.target) || ctx.triggerRef?.current?.contains?.(e?.target)) return;
          ctx.setOpen(false);
        };
        const onKey = e => { if (e?.key === 'Escape') { e.stopPropagation?.(); ctx.setOpen(false); } };
        document.addEventListener?.('pointerdown', onDown, true);
        document.addEventListener?.('keydown', onKey, true);
        return () => {
          document.removeEventListener?.('pointerdown', onDown, true);
          document.removeEventListener?.('keydown', onKey, true);
        };
      }, [ctx?.open, align]);
      if (!ctx?.open) return null;
      const node = h('div', {
        ...rest,
        role: 'listbox',
        ref: el => { if (ctx.contentRef) ctx.contentRef.current = el; },
        className: `agy-fb-pop ${className}`.trim(),
        style: { left: pos ? pos.left : -9999, top: pos ? pos.top : -9999, maxHeight: 320, overflowY: 'auto' }
      }, children);
      return typeof document !== 'undefined' && document.body ? createPortal(node, document.body) : node;
    }

    function FallbackNT({ selected, onClick, children, ...rest }) {
      const ctx = R.useContext ? R.useContext(SelCtx) : null;
      return h('button', {
        type: 'button',
        role: 'option',
        'aria-selected': Boolean(selected),
        ...rest,
        className: 'agy-fb-menu-item',
        style: { fontWeight: selected ? 600 : 400, background: selected ? 'color-mix(in srgb,var(--primary,#2563eb) 12%,transparent)' : undefined },
        onClick: event => {
          onClick?.(event);
          ctx?.setOpen(false);
        }
      },
        h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, children),
        selected ? h('span', { 'aria-hidden': true, style: { fontSize: 12, color: 'var(--primary,#2563eb)' } }, '✓') : null);
    }

    function showFallbackToast(payload) {
      if (!payload || typeof document === 'undefined' || !document.body || typeof document.createElement !== 'function') return;
      ensureFallbackStyles();
      let stack = document.querySelector?.('[data-agy-fallback-toasts]');
      if (!stack) {
        stack = document.createElement('div');
        stack.dataset.agyFallbackToasts = '';
        stack.className = 'agy-fb-toast-stack';
        document.body.append(stack);
      }
      const item = document.createElement('div');
      item.className = 'agy-fb-toast';
      item.setAttribute('role', 'status');
      const titleText = String(payload.title || '').trim();
      const bodyText = String(payload.message || payload.plainTextFallback || '').trim();
      if (titleText) {
        const strong = document.createElement('div');
        strong.style.fontWeight = '600';
        strong.textContent = titleText;
        item.append(strong);
      }
      if (bodyText) {
        const msg = document.createElement('div');
        msg.style.opacity = '0.86';
        msg.textContent = bodyText;
        item.append(msg);
      }
      stack.append(item);
      const t = setTimeout(() => {
        item.remove?.();
        if (stack && !stack.childElementCount) stack.remove?.();
      }, 3200);
      t?.unref?.();
    }

    const FallbackUm = () => showFallbackToast;

    const FallbackHU = meta => {
      if (!meta || typeof meta !== 'object') return -1;
      for (const candidate of [meta.sourceTrajectoryStepInfo?.stepIndex, meta.stepIndex, meta.index, meta.trajectoryStepIndex]) {
        if (Number.isInteger(candidate)) return candidate;
      }
      return -1;
    };

    const FallbackWb = (schema, init = {}) => {
      const base = init && typeof init === 'object' ? { ...init } : {};
      if (schema?.typeName && !base.$typeName) base.$typeName = schema.typeName;
      return base;
    };

    const FallbackTc = (schema, value) => {
      if (!value || typeof value !== 'object') return FallbackWb(schema, {});
      let copy;
      try {
        copy = typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
      } catch {
        copy = { ...value };
      }
      if (value.$typeName && !copy.$typeName) copy.$typeName = value.$typeName;
      else if (schema?.typeName && !copy.$typeName) copy.$typeName = schema.typeName;
      return copy;
    };

    const FallbackIJ = (editor, json) => {
      if (typeof editor?.parseEditorState === 'function') return editor.parseEditorState(json);
      return typeof json === 'string' ? JSON.parse(json) : json;
    };

    const FallbackLN = (items = []) => {
      const textParts = [];
      for (const item of Array.isArray(items) ? items : []) {
        if (item?.chunk?.case === 'text' && typeof item.chunk.value === 'string') {
          textParts.push(item.chunk.value);
        } else if (typeof item?.text === 'string') {
          textParts.push(item.text);
        }
      }
      const fullText = textParts.join('');
      const lines = fullText.split('\n');
      const paragraphs = (lines.length ? lines : ['']).map(line => ({
        children: line ? [{ detail: 0, format: 0, mode: 'normal', style: '', text: line, type: 'text', version: 1 }] : [],
        direction: null,
        format: '',
        indent: 0,
        textFormat: 0,
        textStyle: '',
        type: 'paragraph',
        version: 1
      }));
      return JSON.stringify({
        root: {
          children: paragraphs,
          direction: null,
          format: '',
          indent: 0,
          type: 'root',
          version: 1
        }
      });
    };

    return {
      HC: FallbackHC,
      IC: FallbackIC,
      JC: FallbackJC,
      KC: FallbackKC,
      GC: FallbackGC,
      Uy: FallbackUy,
      XP: FallbackXP,
      UP: FallbackUP,
      TP: FallbackTP,
      VP: FallbackVP,
      dq: FallbackDq,
      k0: FallbackK0,
      Sy: FallbackSy,
      kT: FallbackKT,
      lT: FallbackLT,
      mT: FallbackMT,
      nT: FallbackNT,
      um: FallbackUm,
      HU: FallbackHU,
      I: {},
      tc: FallbackTc,
      Wb: FallbackWb,
      IJ: FallbackIJ,
      LN: FallbackLN
    };
  }

  globalThis.__agyCreateFallbackBindings = createFallbackBindings;

  globalThis.__agyResolveNativeBindings = function (declaredNames = []) {
    const entries = Object.entries(Object.getOwnPropertyDescriptors(globalThis))
      .filter(([, d]) => 'value' in d)
      .map(([name, d]) => ({ name, value: d.value }));
    const seen = new Set(entries.map(e => e.name));
    for (const name of declaredNames) {
      if (/^[A-Za-z_$][\w$]*$/.test(name) && !seen.has(name)) {
        try { entries.push({ name, value: (0, eval)(name) }); seen.add(name); } catch {}
      }
    }
    const callable = value => {
      try {
        for (let i = 0; i < 3 && value && typeof value !== 'function'; i++) {
          if (value.$$typeof === Symbol.for('react.forward_ref')) value = value.render;
          else if (value.$$typeof === Symbol.for('react.memo')) value = value.type;
          else return null;
        }
        return typeof value === 'function' ? value : null;
      } catch { return null; }
    };
    const body = value => {
      const fn = callable(value);
      return fn ? Function.prototype.toString.call(fn) : '';
    };
    const functions = entries
      .filter(e => e.name !== '__agyResolveNativeBindings' && e.name !== '__agyCreateFallbackBindings')
      .map(e => ({ ...e, callable: callable(e.value), source: body(e.value) }))
      .filter(e => e.source);

    const R = globalThis.React;
    const fallbacks = createFallbackBindings(R);
    const names = {};
    const nativeMatched = {};
    const degraded = [];

    const tryFind = (key, ...tests) => {
      for (const test of tests) {
        const matches = functions.filter(e => {
          try { return test(e.source, e.value); } catch { return false; }
        });
        const unique = [...new Map(matches.map(e => [e.callable, e])).values()];
        if (unique.length === 1) {
          names[key] = unique[0].name;
          nativeMatched[key] = unique[0].value;
          return true;
        }
      }
      degraded.push(key);
      return false;
    };

    tryFind('HC', s => s.includes('defaultOpen:') && s.includes('matchTriggerWidth:') && s.includes('disableMobileSheet:'));
    tryFind('IC', s => s.includes('popover-trigger-element') && s.includes('asChild:'), s => s.includes('startDragTracking:') && s.includes('asChild:'));
    tryFind('JC', s => s.includes('arrowNavigable:') && s.includes('matchTriggerWidth:') && (s.includes('scrollContainerClassName:') || s.includes('collisionAvoidance:') || s.includes('contentRef.current=')));
    tryFind('KC', s => s.includes('asChild:') && s.includes('isMobile:') && s.includes('setIsOpen:') && !s.includes('openOnMouseDown:') && s.length < 1400);
    tryFind('GC', s => s.includes('tooltipPlace:') && s.includes('secondaryAction:') && s.includes('main-row-trigger'));
    tryFind('Uy', s => s.includes('paddingClassName:') && s.includes('computedAriaLabel:') && s.includes('asChild:'));
    tryFind('XP', s => s.includes('onCheckedChange:') && s.includes('role:"switch"'));
    tryFind('UP', s => s.includes('label:') && s.includes('rightElement:') && s.includes('extraContent:') && s.includes('descriptionId:') && !s.includes('options:'));
    tryFind('TP', s => s.includes('agy-card') && s.includes('divide-y') && s.includes('divide-border') && s.length < 600);
    tryFind('VP', s => s.includes('headerRight:') && s.includes('defaultCollapsed:') && s.includes('forceExpanded:'));
    tryFind('dq', s => s.includes('google-symbols') && s.includes('name:') && s.includes('Icon'));
    tryFind('k0', s => s.includes('trigger:') && s.includes('triggerVisible:') && s.includes('defaultExpanded:'));
    tryFind('Sy', (_s, v) => v?.displayName === 'CompactTooltipBaseUi', s => s.includes('CompactTooltipBaseUi'));
    tryFind('kT', s => s.includes('ownsHighlight:') && s.includes('onHighlightExit:') && s.includes('onSearchQueryChange:'));
    tryFind('lT', s => s.includes('asChild:') && s.includes('openOnHover:') && s.includes('closeDelay:') && s.length < 1500);
    tryFind('mT', s => s.includes('collisionBoundary:') && s.includes('alignOffset:') && s.includes('keepMounted:'));
    tryFind('nT', s => s.includes('highlighted:') && s.includes('selected:') && s.includes('managedHighlight:'));
    tryFind('um', s => s.includes('showNotification') && s.includes('plainTextFallback:'));
    tryFind('Wz', s => s.includes('closeButtonPosition:') && s.includes('scrollToBottomOnOpen:'));

    tryFind('HU', s => s.includes('sourceTrajectoryStepInfo') && s.includes('stepIndex') && s.length < 260);
    tryFind(
      'resolve',
      s => s.includes('lookupCustomModelInfo') && s.includes('customModelInfoOverride') && s.includes('checkpointConfig') && s.length < 1500,
      s => s.includes('CascadeConfigSchema') && s.includes('lookupCustomModelInfo') && s.length < 1800
    );
    tryFind('segment', s => s.includes('getStepRendererConfig:') && s.includes('hasBeenCollapsed:') && s.includes('leadingSteps:'));
    tryFind(
      'menu',
      s => s.includes('onRenameClick:') && s.includes('onRestoreClick:') && s.includes('onCreateGroup:'),
      s => s.includes('onRenameClick:') && s.includes('onRestoreClick:') && s.includes('isArchived')
    );

    const schemas = entries.filter(e => {
      try { return e.value && typeof e.value === 'object' && Object.getOwnPropertyDescriptor(e.value, 'CascadeConfigSchema')?.value; }
      catch { return false; }
    });
    if (schemas.length === 1) {
      nativeMatched.I = schemas[0].value;
      names.I = schemas[0].name;
    } else {
      degraded.push('I');
    }

    const annSchemas = entries.filter(e => {
      try { return e.value && typeof e.value === 'object' && Object.getOwnPropertyDescriptor(e.value, 'ConversationAnnotationsSchema')?.value; }
      catch { return false; }
    });
    if (annSchemas.length === 1) {
      nativeMatched.YF = annSchemas[0].value;
      names.YF = annSchemas[0].name;
    }

    const findOptional = (key, test) => {
      const matches = functions.filter(e => {
        try { return test(e.source, e.value); } catch { return false; }
      });
      const unique = [...new Map(matches.map(e => [e.callable, e])).values()];
      if (unique.length === 1) {
        names[key] = unique[0].name;
        nativeMatched[key] = unique[0].value;
      }
    };
    findOptional('MUa', s => s.includes('ContextScopeItemSchema') && s.includes('absoluteUri:') && !s.includes('switch(') && s.length < 320);
    findOptional('Shd', s => s.includes('ContextScopeItemSchema') && /scopeItem:\{case:[A-Za-z_$]/.test(s) && s.includes('absoluteUri:') && !s.includes('switch(') && s.length < 300);
    findOptional('Gy', s => s.includes('.isCollapsed()') && s.includes('.insertNodes(') && s.length < 400);

    const cloneMatch = nativeMatched.resolve && body(nativeMatched.resolve).match(/=([\w$]+)\([\w$]+\.CascadeConfigSchema,/);
    const cloneValue = cloneMatch && entries.find(e => e.name === cloneMatch[1])?.value;
    if (typeof cloneValue === 'function') {
      nativeMatched.tc = cloneValue;
      names.tc = cloneMatch[1];
    } else {
      degraded.push('tc');
    }

    tryFind('Wb', s => s.includes('.$typeName=') && s.includes('.members') && s.includes('oneof') && s.includes('Object.create'));
    tryFind('IJ', s => s.includes('._dirtyElements') && s.includes('._dirtyLeaves') && s.includes('JSON.parse'));
    tryFind('LN', s => s.includes('JSON.stringify') && s.includes('version:1') && ((s.includes('contextScope') && s.includes('chunk.case')) || (s.includes('singleParagraph') && s.includes('type:"root"'))));

    // Compound UI groups must switch atomically so React context providers/consumers never mix native and fallback instances.
    const popoverNativeOk = ['HC', 'IC', 'JC', 'KC'].every(k => typeof nativeMatched[k] === 'function');
    const selectNativeOk = ['kT', 'lT', 'mT', 'nT'].every(k => typeof nativeMatched[k] === 'function');

    const bindings = {
      B: R,
      HC: popoverNativeOk ? nativeMatched.HC : fallbacks.HC,
      IC: popoverNativeOk ? nativeMatched.IC : fallbacks.IC,
      JC: popoverNativeOk ? nativeMatched.JC : fallbacks.JC,
      KC: popoverNativeOk ? nativeMatched.KC : fallbacks.KC,
      GC: (popoverNativeOk && typeof nativeMatched.GC === 'function') ? nativeMatched.GC : fallbacks.GC,
      Uy: typeof nativeMatched.Uy === 'function' ? nativeMatched.Uy : fallbacks.Uy,
      XP: typeof nativeMatched.XP === 'function' ? nativeMatched.XP : fallbacks.XP,
      UP: typeof nativeMatched.UP === 'function' ? nativeMatched.UP : fallbacks.UP,
      TP: typeof nativeMatched.TP === 'function' ? nativeMatched.TP : fallbacks.TP,
      VP: typeof nativeMatched.VP === 'function' ? nativeMatched.VP : fallbacks.VP,
      dq: typeof nativeMatched.dq === 'function' ? nativeMatched.dq : fallbacks.dq,
      k0: typeof nativeMatched.k0 === 'function' ? nativeMatched.k0 : fallbacks.k0,
      Sy: typeof nativeMatched.Sy === 'function' ? nativeMatched.Sy : fallbacks.Sy,
      kT: selectNativeOk ? nativeMatched.kT : fallbacks.kT,
      lT: selectNativeOk ? nativeMatched.lT : fallbacks.lT,
      mT: selectNativeOk ? nativeMatched.mT : fallbacks.mT,
      nT: selectNativeOk ? nativeMatched.nT : fallbacks.nT,
      um: typeof nativeMatched.um === 'function' ? nativeMatched.um : fallbacks.um,
      Wz: typeof nativeMatched.Wz === 'function' ? nativeMatched.Wz : undefined,
      HU: typeof nativeMatched.HU === 'function' ? nativeMatched.HU : fallbacks.HU,
      I: nativeMatched.I || fallbacks.I,
      tc: typeof nativeMatched.tc === 'function' ? nativeMatched.tc : fallbacks.tc,
      Wb: typeof nativeMatched.Wb === 'function' ? nativeMatched.Wb : fallbacks.Wb,
      IJ: typeof nativeMatched.IJ === 'function' ? nativeMatched.IJ : fallbacks.IJ,
      LN: typeof nativeMatched.LN === 'function' ? nativeMatched.LN : fallbacks.LN,
      VD: typeof globalThis.createFileRoute === 'function' ? (options => globalThis.createFileRoute('/powertools')(options)) : undefined,
      YF: nativeMatched.YF,
      MUa: nativeMatched.MUa,
      Gy: nativeMatched.Gy,
      Shd: nativeMatched.Shd,
      names: {
        resolve: names.resolve || '',
        segment: names.segment || '',
        menu: names.menu || ''
      },
      degraded
    };

    return { bindings, names, degraded };
  };
})();
