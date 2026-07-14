import logoRetiro from '@/assets/logo-retiro.png'

export function PageTopLogo() {
  return (
    <div className="flex justify-center">
      <span className="flex h-24 w-24 items-center justify-center rounded-[24px] border border-amber-200/30 bg-[#f4ead7] p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] md:h-28 md:w-28">
        <img
          src={logoRetiro}
          alt="Logo Retiro 2027"
          className="h-full w-full object-contain"
        />
      </span>
    </div>
  )
}
