export type TrackingParams = {
    utm_source?: string
    utm_content?: string
    utm_term?: string
    utm_medium?: string
    utm_campaign?: string
    utm_sourceid?: string
    sourceid?: string
    merchantid?: string
    sourcid?: string
    gacid?: string | false
    _ga?: string | false
}
export type TrackingParam = keyof TrackingParams;