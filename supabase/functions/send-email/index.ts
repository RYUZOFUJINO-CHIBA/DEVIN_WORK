import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const POWER_AUTOMATE_URL = Deno.env.get('POWER_AUTOMATE_URL')
const SYSTEM_NAME = '営業積算支援システム'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, to, projectName, personName, mentionUsers = [], mentionUserNames = [] } = await req.json()
    
    if (!type || !to || !projectName || !personName) {
      throw new Error('Missing required parameters: type, to, projectName, personName')
    }

    if (!POWER_AUTOMATE_URL) {
      throw new Error('POWER_AUTOMATE_URL environment variable is required')
    }
    
    console.log(`Processing ${type} Power Automate notification request:`, {
      to,
      projectName,
      personName,
      mentionUsers,
      mentionUserNames,
      timestamp: new Date().toISOString()
    })
    
    const createPowerAutomateMessage = (type: string, projectName: string, personName: string, to: string, mentionUsers: string[], mentionUserNames: string[]) => {
      const currentTime = new Date().toLocaleString('ja-JP')
      
      if (type === 'assignment') {
        return {
          notificationType: 'assignment',
          title: '🎯 新しい積算依頼が割り当てられました（チャンネル全体通知）',
          subtitle: `${SYSTEM_NAME}からの自動通知`,
          projectName: projectName,
          personName: personName,
          email: to,
          datetime: currentTime,
          color: 'good', // Power Automate用カラー: good (緑), attention (黄), warning (赤)
          systemUrl: 'https://ltkgmmbapafctihusddh.supabase.co',
          actionText: 'システムにログイン',
          mentionUsers: mentionUsers,
          mentionUserNames: mentionUserNames
        }
      } else if (type === 'completion') {
        return {
          notificationType: 'completion',
          title: '✅ 積算依頼が完了しました（チャンネル全体通知）',
          subtitle: `${SYSTEM_NAME}からの自動通知`,
          projectName: projectName,
          personName: personName,
          email: to,
          datetime: currentTime,
          color: 'good',
          systemUrl: 'https://ltkgmmbapafctihusddh.supabase.co',
          actionText: '結果を確認',
          mentionUsers: mentionUsers,
          mentionUserNames: mentionUserNames
        }
      }
      
      throw new Error(`Unknown message type: ${type}`)
    }
    
    const powerAutomateMessage = createPowerAutomateMessage(type, projectName, personName, to, mentionUsers, mentionUserNames)
    
    console.log('Power Automate message prepared:', {
      to,
      type,
      projectName,
      personName,
      mentionUsers,
      mentionUserNames
    })
    
    // Send message to Microsoft Teams via Power Automate
    const powerAutomateResponse = await fetch(POWER_AUTOMATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(powerAutomateMessage)
    })

    if (!powerAutomateResponse.ok) {
      const errorText = await powerAutomateResponse.text()
      throw new Error(`Power Automate error: ${powerAutomateResponse.status} - ${errorText}`)
    }
    
    console.log(`✅ Power Automate message successfully sent for ${type}: ${projectName}`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Power Automate notification sent successfully',
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
    console.error('❌ Error sending Power Automate notification:', error)
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