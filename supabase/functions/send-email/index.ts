import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TEAMS_WEBHOOK_URL = Deno.env.get('TEAMS_WEBHOOK_URL')
const SYSTEM_NAME = '営業積算支援システム'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, to, projectName, personName } = await req.json()
    
    if (!type || !to || !projectName || !personName) {
      throw new Error('Missing required parameters: type, to, projectName, personName')
    }

    if (!TEAMS_WEBHOOK_URL) {
      throw new Error('TEAMS_WEBHOOK_URL environment variable is required')
    }
    
    console.log(`Processing ${type} Teams notification request:`, {
      to,
      projectName,
      personName,
      timestamp: new Date().toISOString()
    })
    
    const createTeamsMessage = (type: string, projectName: string, personName: string, to: string) => {
      const currentTime = new Date().toLocaleString('ja-JP')
      
      if (type === 'assignment') {
        return {
          "@type": "MessageCard",
          "@context": "http://schema.org/extensions",
          "themeColor": "0078D4",
          "summary": `積算依頼アサイン: ${projectName}`,
          "sections": [{
            "activityTitle": "🎯 新しい積算依頼が割り当てられました",
            "activitySubtitle": `${SYSTEM_NAME}からの自動通知`,
            "facts": [
              {
                "name": "案件名",
                "value": projectName
              },
              {
                "name": "積算担当者",
                "value": personName
              },
              {
                "name": "担当者メール",
                "value": to
              },
              {
                "name": "依頼日時",
                "value": currentTime
              }
            ],
            "markdown": true
          }],
          "potentialAction": [{
            "@type": "OpenUri",
            "name": "システムにログイン",
            "targets": [{
              "os": "default",
              "uri": "https://ltkgmmbapafctihusddh.supabase.co"
            }]
          }]
        }
      } else if (type === 'completion') {
        return {
          "@type": "MessageCard",
          "@context": "http://schema.org/extensions",
          "themeColor": "00FF00",
          "summary": `積算完了: ${projectName}`,
          "sections": [{
            "activityTitle": "✅ 積算依頼が完了しました",
            "activitySubtitle": `${SYSTEM_NAME}からの自動通知`,
            "facts": [
              {
                "name": "案件名",
                "value": projectName
              },
              {
                "name": "営業担当者",
                "value": personName
              },
              {
                "name": "担当者メール",
                "value": to
              },
              {
                "name": "完了日時",
                "value": currentTime
              }
            ],
            "markdown": true
          }],
          "potentialAction": [{
            "@type": "OpenUri",
            "name": "結果を確認",
            "targets": [{
              "os": "default",
              "uri": "https://ltkgmmbapafctihusddh.supabase.co"
            }]
          }]
        }
      }
      
      throw new Error(`Unknown message type: ${type}`)
    }
    
    const teamsMessage = createTeamsMessage(type, projectName, personName, to)
    
    console.log('Teams message prepared:', {
      to,
      type,
      projectName,
      personName
    })
    
    // Send message to Microsoft Teams via Webhook
    const teamsResponse = await fetch(TEAMS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teamsMessage)
    })

    if (!teamsResponse.ok) {
      const errorText = await teamsResponse.text()
      throw new Error(`Teams Webhook error: ${teamsResponse.status} - ${errorText}`)
    }
    
    console.log(`✅ Teams message successfully sent for ${type}: ${projectName}`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Teams notification sent successfully',
        details: {
          to,
          projectName,
          personName,
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
    console.error('❌ Error sending Teams notification:', error)
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