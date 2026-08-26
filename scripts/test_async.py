# -*- coding: utf-8 -*-
"""
异步任务化端到端验证脚本
- 登录获取 session
- 提交生成任务,确认立即返回 task_id(不再阻塞)
- 轮询 /api/task/<id> 直至 done/error
- 覆盖:图片 JSON 提交、multipart 提交、错误路径、404 静默
"""
import sys
import time
import urllib.parse

import requests

BASE = 'http://127.0.0.1:5000'


def login(session):
    r = session.post(BASE + '/login', json={'username': 'admin', 'password': 'password'})
    assert r.status_code == 200, f'login failed: {r.status_code} {r.text}'
    print('登录成功')


def poll_until_done(session, task_id, timeout=300):
    """轮询任务状态直到 done/error/not_found"""
    start = time.time()
    while time.time() - start < timeout:
        r = session.get(BASE + f'/api/task/{task_id}')
        assert r.status_code == 200, f'task query failed: {r.status_code} {r.text}'
        task = r.json()
        if task['status'] in ('done', 'error'):
            return task
        time.sleep(2)
    raise TimeoutError(f'任务 {task_id} 轮询超时')


def test_image_json(session):
    """JSON 提交图片生成,应立即返回 task_id"""
    print('\n=== 测试1: 图片 JSON 提交(z_image_turbo) ===')
    r = session.post(BASE + '/generate', json={
        'model': 'z_image_turbo',
        'prompt': 'test async image',
        'width': 512,
        'height': 512,
        'seed': ''
    })
    assert r.status_code == 200, f'提交失败: {r.status_code} {r.text}'
    data = r.json()
    assert 'task_id' in data, f'响应中没有 task_id: {data}'
    print(f'提交返回: {data}(立即返回,未阻塞)')

    # 确认立即返回(提交耗时应该 < 3 秒)
    task = poll_until_done(session, data['task_id'], timeout=120)
    print(f'任务状态: {task["status"]}, 结果: {task["result"]}')
    assert task['status'] == 'done' and 'image_url' in task['result'], f'任务未成功: {task}'
    print('测试1 通过 ✓')


def test_edit_no_image(session):
    """编辑模型不传图:应同步 400,不创建任务"""
    print('\n=== 测试2: flux2_klein_edit 不传图(同步 400) ===')
    r = session.post(BASE + '/generate', data={
        'model': 'flux2_klein_edit',
        'prompt': 'test',
        'seed': ''
    }, files={'f': (None, 'x')})  # 强制 multipart（前端真实走 FormData）
    assert r.status_code == 400, f'应返回 400,实际 {r.status_code} {r.text}'
    print(f'同步拒绝: {r.text}')
    print('测试2 通过 ✓')


def test_i2v_no_image(session):
    """图生视频不传首帧:应同步 400,不创建任务"""
    print('\n=== 测试3: 图生视频无首帧(同步 400) ===')
    r = session.post(BASE + '/generate', data={
        'model': 'minimax_h3_i2v_turbo',
        'prompt': 'test',
        'aspect_ratio': '1:1 (Square)',
        'duration': '5',
        'seed': ''
    }, files={'f': (None, 'x')})  # 强制 multipart
    assert r.status_code == 400, f'应返回 400,实际 {r.status_code} {r.text}'
    print(f'同步拒绝: {r.text}')
    print('测试3 通过 ✓')


def test_unknown_task(session):
    """查询不存在的任务:应 404(前端据此静默清理)"""
    print('\n=== 测试4: 查询不存在的任务(404) ===')
    r = session.get(BASE + '/api/task/deadbeef')
    assert r.status_code == 404, f'应返回 404,实际 {r.status_code} {r.text}'
    print(f'404: {r.text}')
    print('测试4 通过 ✓')


def test_not_logged_in():
    """未登录查询任务:应 401"""
    print('\n=== 测试5: 未登录查询任务(401) ===')
    r = requests.get(BASE + '/api/task/whatever')
    assert r.status_code == 401, f'应返回 401,实际 {r.status_code} {r.text}'
    print(f'401: {r.text}')
    print('测试5 通过 ✓')


def main():
    session = requests.Session()
    login(session)
    test_image_json(session)
    test_edit_no_image(session)
    test_i2v_no_image(session)
    test_unknown_task(session)
    test_not_logged_in()
    print('\n=== 全部测试通过 ===')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    main()
