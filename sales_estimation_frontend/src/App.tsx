import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { supabase, EstimationRequest, STATUS_OPTIONS } from './lib/supabase'

function App() {
  const [requests, setRequests] = useState<EstimationRequest[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<EstimationRequest | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formData, setFormData] = useState({
    request_date: new Date().toISOString().split('T')[0],
    desired_estimation_date: '',
    project_name: '',
    zac_project_number: '',
    sales_person: '',
    estimation_person: '',
    status: '未着手',
    estimation: '',
    completion_date: '',
    remarks: '',
    estimation_materials: '',
    box_url: '',
    others: ''
  })

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('estimation_requests')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching requests:', error)
        return
      }
      
      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const submitData = {
        request_date: formData.request_date || null,
        desired_estimation_date: formData.desired_estimation_date || null,
        project_name: formData.project_name || null,
        zac_project_number: formData.zac_project_number || null,
        sales_person: formData.sales_person || null,
        estimation_person: formData.estimation_person || null,
        status: formData.status || null,
        estimation: formData.estimation || null,
        completion_date: formData.completion_date || null,
        remarks: formData.remarks || null,
        estimation_materials: formData.estimation_materials || null,
        box_url: formData.box_url || null,
        others: formData.others || null
      }

      let result
      if (editingRequest) {
        result = await supabase
          .from('estimation_requests')
          .update(submitData)
          .eq('id', editingRequest.id)
      } else {
        result = await supabase
          .from('estimation_requests')
          .insert([submitData])
      }

      if (result.error) {
        console.error('Error submitting request:', result.error)
        return
      }

      await fetchRequests()
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error saving request:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('この積算依頼を削除しますか？')) {
      try {
        const { error } = await supabase
          .from('estimation_requests')
          .delete()
          .eq('id', id)

        if (error) {
          console.error('Error deleting request:', error)
          return
        }

        await fetchRequests()
      } catch (error) {
        console.error('Error deleting request:', error)
      }
    }
  }

  const handleEdit = (request: EstimationRequest) => {
    setEditingRequest(request)
    setFormData({
      request_date: request.request_date || '',
      desired_estimation_date: request.desired_estimation_date || '',
      project_name: request.project_name || '',
      zac_project_number: request.zac_project_number || '',
      sales_person: request.sales_person || '',
      estimation_person: request.estimation_person || '',
      status: request.status || '',
      estimation: request.estimation || '',
      completion_date: request.completion_date || '',
      remarks: request.remarks || '',
      estimation_materials: request.estimation_materials || '',
      box_url: request.box_url || '',
      others: request.others || ''
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingRequest(null)
    setFormData({
      request_date: new Date().toISOString().split('T')[0],
      desired_estimation_date: '',
      project_name: '',
      zac_project_number: '',
      sales_person: '',
      estimation_person: '',
      status: '未着手',
      estimation: '',
      completion_date: '',
      remarks: '',
      estimation_materials: '',
      box_url: '',
      others: ''
    })
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = searchTerm === '' || 
      request.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.zac_project_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.sales_person?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case '完了': return 'default'
      case '中止': return 'destructive'
      case '着手中': return 'secondary'
      case '検討中': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">営業積算支援ツール</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              新規登録
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRequest ? '積算依頼編集' : '新規積算依頼登録'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="request_date">依頼日 *</Label>
                  <Input
                    id="request_date"
                    type="date"
                    value={formData.request_date}
                    onChange={(e) => setFormData({...formData, request_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="desired_estimation_date">積算希望日</Label>
                  <Input
                    id="desired_estimation_date"
                    type="date"
                    value={formData.desired_estimation_date}
                    onChange={(e) => setFormData({...formData, desired_estimation_date: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="project_name">案件名 *</Label>
                <Input
                  id="project_name"
                  value={formData.project_name}
                  onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zac_project_number">ZAC案件番号</Label>
                  <Input
                    id="zac_project_number"
                    value={formData.zac_project_number}
                    onChange={(e) => setFormData({...formData, zac_project_number: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="status">ステータス *</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sales_person">営業担当</Label>
                  <Input
                    id="sales_person"
                    value={formData.sales_person}
                    onChange={(e) => setFormData({...formData, sales_person: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="estimation_person">積算担当</Label>
                  <Input
                    id="estimation_person"
                    value={formData.estimation_person}
                    onChange={(e) => setFormData({...formData, estimation_person: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="box_url">BOXURL</Label>
                <Input
                  id="box_url"
                  type="url"
                  value={formData.box_url}
                  onChange={(e) => setFormData({...formData, box_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="estimation_materials">積算資料</Label>
                <Textarea
                  id="estimation_materials"
                  value={formData.estimation_materials}
                  onChange={(e) => setFormData({...formData, estimation_materials: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="remarks">備考</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="others">その他</Label>
                <Textarea
                  id="others"
                  value={formData.others}
                  onChange={(e) => setFormData({...formData, others: e.target.value})}
                />
              </div>

              {editingRequest && (
                <>
                  <div>
                    <Label htmlFor="estimation">積算</Label>
                    <Textarea
                      id="estimation"
                      value={formData.estimation}
                      onChange={(e) => setFormData({...formData, estimation: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="completion_date">完了日</Label>
                    <Input
                      id="completion_date"
                      type="date"
                      value={formData.completion_date}
                      onChange={(e) => setFormData({...formData, completion_date: e.target.value})}
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button type="submit">
                  {editingRequest ? '更新' : '登録'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>積算依頼一覧</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="status-filter">ステータス:</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="全て" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全て</SelectItem>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <Input
                  placeholder="案件名、ZAC番号、営業担当で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>依頼日</TableHead>
                <TableHead>案件名</TableHead>
                <TableHead>ZAC案件番号</TableHead>
                <TableHead>営業担当</TableHead>
                <TableHead>積算担当</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>積算希望日</TableHead>
                <TableHead>完了日</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.request_date}</TableCell>
                  <TableCell className="font-medium">{request.project_name}</TableCell>
                  <TableCell>{request.zac_project_number}</TableCell>
                  <TableCell>{request.sales_person}</TableCell>
                  <TableCell>{request.estimation_person}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(request.status)}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{request.desired_estimation_date}</TableCell>
                  <TableCell>{request.completion_date}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(request)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => request.id && handleDelete(request.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredRequests.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              積算依頼がありません
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default App
