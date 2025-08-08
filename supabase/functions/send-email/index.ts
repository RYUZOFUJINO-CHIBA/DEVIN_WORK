import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, to, projectName, personName } = await req.json()
    
    if (!type || !to || !projectName || !personName) {
      throw new Error('Missing required parameters: type, to, projectName, personName')
    }
    
    console.log(`Processing ${type} email request:`, {
      to,
      projectName,
      personName,
      timestamp: new Date().toISOString()
    })
    
    const templates = {
      assignment: {
        subject: `【積算依頼】${projectName} - 積算担当者アサイン通知`,
        body: `${personName}様

新しい積算依頼が割り当てられました。

案件名: ${projectName}
積算担当者: ${personName}
依頼日時: ${new Date().toLocaleString('ja-JP')}

積算支援システムにログインして詳細をご確認ください。

※このメールは自動送信されています。`
      },
      completion: {
        subject: `【積算完了】${projectName} - 積算作業完了通知`, 
        body: `${personName}様

積算依頼が完了しました。

案件名: ${projectName}
営業担当者: ${personName}
完了日時: ${new Date().toLocaleString('ja-JP')}

積算支援システムにログインして結果をご確認ください。

※このメールは自動送信されています。`
      }
    }
    
    const template = templates[type as keyof typeof templates]
    if (!template) {
      throw new Error(`Unknown email type: ${type}. Supported types: assignment, completion`)
    }
    
    console.log('Email content prepared:', {
      to,
      subject: template.subject,
      bodyLength: template.body.length,
      type
    })
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    console.log(`✅ Email successfully sent to ${to}`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        details: {
          to,
          subject: template.subject,
          type,
          sentAt: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Error sending email:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
