export function BrandBackdrop() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(60rem 40rem at -10% -10%, rgb(45 212 191 / 0.35), transparent 60%), radial-gradient(40rem 30rem at 110% 110%, rgb(56 189 248 / 0.25), transparent 60%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(255 255 255) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
        aria-hidden="true"
      />
    </>
  );
}
