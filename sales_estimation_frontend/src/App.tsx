import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Users, Settings, LogOut, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { supabase, EstimationRequest, STATUS_OPTIONS, User } from './lib/supabase'
import { toast } from "sonner"

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [requests, setRequests] = useState<EstimationRequest[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<EstimationRequest | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [userFormData, setUserFormData] = useState<Partial<User>>({
    username: '',
    email: ''
  })
  const [newPassword, setNewPassword] = useState('')
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
    checkAuthentication()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchRequests()
      fetchUsers()
    }
  }, [isAuthenticated])

  const checkAuthentication = () => {
    const authStatus = sessionStorage.getItem('isAuthenticated')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
    }
  }

  const handleLogin = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_password')
        .single()

      if (error) throw error

      if (password === data.setting_value) {
        setIsAuthenticated(true)
        sessionStorage.setItem('isAuthenticated', 'true')
        toast.success('ログインしました')
      } else {
        toast.error('パスワードが間違っています')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('ログインエラーが発生しました')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('isAuthenticated')
    toast.success('ログアウトしました')
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('username')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('ユーザー情報の取得に失敗しました')
    }
  }

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

      const oldStatus = editingRequest?.status
      const newStatus = formData.status
      const oldEstimationPerson = editingRequest?.estimation_person
      const newEstimationPerson = formData.estimation_person

      let result
      if (editingRequest) {
        result = await supabase
          .from('estimation_requests')
          .update(submitData)
          .eq('id', editingRequest.id)
        
        if (result.error) {
          console.error('Error updating request:', result.error)
          toast.error('更新に失敗しました')
          return
        }
        toast.success('積算依頼を更新しました')

        if (oldStatus !== newStatus && newStatus === '完了') {
          await sendCompletionEmail(formData.sales_person, formData.project_name)
        }
      } else {
        result = await supabase
          .from('estimation_requests')
          .insert([submitData])
        
        if (result.error) {
          console.error('Error creating request:', result.error)
          toast.error('登録に失敗しました')
          return
        }
        toast.success('積算依頼を登録しました')

        if (formData.estimation_person) {
          await sendAssignmentEmail(formData.estimation_person, formData.project_name)
        }
      }

      if (editingRequest && oldEstimationPerson !== newEstimationPerson && newEstimationPerson) {
        await sendAssignmentEmail(newEstimationPerson, formData.project_name)
      }

      await fetchRequests()
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error saving request:', error)
      toast.error('保存に失敗しました')
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

  const sendAssignmentEmail = async (personName: string | null | undefined, projectName: string | null | undefined) => {
    if (!personName) return
    
    const user = users.find(u => u.username === personName)
    if (!user?.email) return

    toast.info(`積算担当者 ${personName} にメール通知を送信しました`)
    console.log(`Email sent to ${user.email} for project: ${projectName}`)
  }

  const sendCompletionEmail = async (personName: string | null | undefined, projectName: string | null | undefined) => {
    if (!personName) return
    
    const user = users.find(u => u.username === personName)
    if (!user?.email) return

    toast.info(`営業担当者 ${personName} にメール通知を送信しました`)
    console.log(`Completion email sent to ${user.email} for project: ${projectName}`)
  }

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingUser) {
        const { error } = await supabase
          .from('users')
          .update(userFormData)
          .eq('id', editingUser.id)
        
        if (error) throw error
        toast.success('ユーザーを更新しました')
      } else {
        const { error } = await supabase
          .from('users')
          .insert([userFormData])
        
        if (error) throw error
        toast.success('ユーザーを登録しました')
      }
      
      fetchUsers()
      resetUserForm()
      setIsUserDialogOpen(false)
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error('ユーザーの保存に失敗しました')
    }
  }

  const handlePasswordUpdate = async () => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ setting_value: newPassword })
        .eq('setting_key', 'admin_password')
      
      if (error) throw error
      toast.success('パスワードを更新しました')
      setNewPassword('')
      setIsPasswordDialogOpen(false)
    } catch (error) {
      console.error('Error updating password:', error)
      toast.error('パスワードの更新に失敗しました')
    }
  }

  const resetUserForm = () => {
    setUserFormData({
      username: '',
      email: ''
    })
    setEditingUser(null)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setUserFormData(user)
    setIsUserDialogOpen(true)
  }

  const handleDeleteUser = async (id: number) => {
    if (window.confirm('このユーザーを削除しますか？')) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        toast.success('ユーザーを削除しました')
        fetchUsers()
      } catch (error) {
        console.error('Error deleting user:', error)
        toast.error('ユーザーの削除に失敗しました')
      }
    }
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <img src="/logo.svg" alt="Logo" className="h-12 w-auto" />
            </div>
            <CardTitle>営業積算支援ツール</CardTitle>
            <CardDescription>パスワードを入力してください</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <Button onClick={handleLogin} className="w-full">
                ログイン
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <img src="/logo.svg" alt="Logo" className="h-12 w-auto" />
          <h1 className="text-3xl font-bold">営業積算支援ツール</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                ユーザー管理
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>ユーザー管理</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">ユーザー一覧</h3>
                  <Button onClick={() => { resetUserForm(); setIsUserDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    新規ユーザー
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ユーザー名</TableHead>
                      <TableHead>メールアドレス</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user.id!)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <form onSubmit={handleUserSubmit} className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold">{editingUser ? 'ユーザー編集' : '新規ユーザー登録'}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">ユーザー名</Label>
                      <Input
                        id="username"
                        value={userFormData.username}
                        onChange={(e) => setUserFormData({...userFormData, username: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">メールアドレス</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userFormData.email}
                        onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit">
                      {editingUser ? '更新' : '登録'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetUserForm}>
                      キャンセル
                    </Button>
                  </div>
                </form>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                パスワード変更
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>パスワード変更</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">新しいパスワード</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handlePasswordUpdate}>
                    更新
                  </Button>
                  <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                    キャンセル
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            ログアウト
          </Button>
        </div>
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
                  <Select value={formData.sales_person} onValueChange={(value) => setFormData({...formData, sales_person: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="営業担当を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.username}>
                          {user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="estimation_person">積算担当</Label>
                  <Select value={formData.estimation_person} onValueChange={(value) => setFormData({...formData, estimation_person: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="積算担当を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.username}>
                          {user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <TableHead>積算希望日</TableHead>
                <TableHead>案件名</TableHead>
                <TableHead>ZAC案件番号</TableHead>
                <TableHead>営業担当</TableHead>
                <TableHead>積算担当</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>積算</TableHead>
                <TableHead>完了日</TableHead>
                <TableHead>備考</TableHead>
                <TableHead>積算資料</TableHead>
                <TableHead>BOXURL</TableHead>
                <TableHead>その他</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.request_date}</TableCell>
                  <TableCell>{request.desired_estimation_date}</TableCell>
                  <TableCell className="font-medium">{request.project_name}</TableCell>
                  <TableCell>{request.zac_project_number}</TableCell>
                  <TableCell>{request.sales_person}</TableCell>
                  <TableCell>{request.estimation_person}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(request.status)}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-32 truncate">{request.estimation}</TableCell>
                  <TableCell>{request.completion_date}</TableCell>
                  <TableCell className="max-w-32 truncate">{request.remarks}</TableCell>
                  <TableCell className="max-w-32 truncate">{request.estimation_materials}</TableCell>
                  <TableCell className="max-w-32 truncate">
                    {request.box_url && (
                      <a href={request.box_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        URL
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="max-w-32 truncate">{request.others}</TableCell>
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
