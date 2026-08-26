"""
异步任务存储模块
内存任务表 + 后台线程管理,支持任务状态轮询(解决长请求断链问题)
"""
import threading
import time
import uuid

# 任务存储:task_id -> {status, created_at, result, error}
# status: pending / running / done / error
TASKS = {}
TASKS_LOCK = threading.Lock()
MAX_TASKS = 50  # 最多保留的任务数,超出清理最旧的


def create_task():
    """创建任务记录,返回 task_id"""
    task_id = uuid.uuid4().hex
    with TASKS_LOCK:
        # 超出上限时清理最旧的已完成任务
        if len(TASKS) >= MAX_TASKS:
            oldest_id = min(TASKS, key=lambda tid: TASKS[tid]['created_at'])
            del TASKS[oldest_id]
        TASKS[task_id] = {
            'status': 'pending',
            'created_at': time.time(),
            'result': None,
            'error': None
        }
    return task_id


def update_task(task_id, **kwargs):
    """更新任务字段"""
    with TASKS_LOCK:
        if task_id in TASKS:
            TASKS[task_id].update(kwargs)


def get_task(task_id):
    """获取任务记录,不存在返回 None"""
    with TASKS_LOCK:
        task = TASKS.get(task_id)
        return dict(task) if task else None


def start_task(target, task_id, args=()):
    """
    在后台 daemon 线程中执行任务函数 target(task_id, *args)。
    任务函数应自行调用 update_task 更新状态;未捕获异常会写为 error。
    """
    def wrapper():
        try:
            target(task_id, *args)
        except Exception as exc:
            print(f"任务线程异常: {exc}")
            update_task(task_id, status='error', error=str(exc))

    thread = threading.Thread(target=wrapper, daemon=True)
    thread.start()
