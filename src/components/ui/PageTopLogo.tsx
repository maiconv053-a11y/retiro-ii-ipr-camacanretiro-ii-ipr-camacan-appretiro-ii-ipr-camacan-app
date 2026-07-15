import logoRetiro from '@/assets/logo-retiro.png'

export function PageTopLogo() {
  return (
    <div className="flex justify-center">
      <span className="flex h-24 w-24 items-center justify-center rounded-[24px] border border-[#b8d1c0]/70 bg-[#f6faf7] p-2 shadow-[0_12px_28px_rgba(101,136,116,0.12)] md:h-28 md:w-28">
        <img
          src={logoRetiro}
          alt="Logo Retiro 2027"
          className="h-full w-full object-contain"
        />
      </span>
    </div>
  )
}
