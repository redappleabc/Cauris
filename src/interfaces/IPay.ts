export interface ICinetNotify {
    cpm_trans_id: string
    cpm_site_id: string
    cpm_trans_date:string
    cpm_amount:string
    cpm_currency:string
    signature:string
    payment_method:string
    cel_phone_num:string
    cpm_phone_prefixe:string
    cpm_language:string
    cpm_version:string
    cpm_payment_config:string
    cpm_page_action:string
    cpm_custom?:string
    cpm_designation?:string
}

export interface ICinetPay {
    amount: number
    currency: string
    channels: string
    description: string
    payment_type: string
}