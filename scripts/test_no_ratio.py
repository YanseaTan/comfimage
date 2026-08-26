# -*- coding: utf-8 -*-
"""
验证移除 I2V 比例输入:
1. I2V 带首帧图、不传 aspect_ratio → 应正常生成(分辨率由模板 GetImageSize 按图片自动计算)
2. T2V 带 aspect_ratio → 注入仍生效(任务进入 running 而非 error)
"""
import os
import sys
import time

import requests

BASE = 'http://127.0.0.1:5000'
INPUT_DIR = r'C:\Users\yanse\Downloads\comfyui_v2\ComfyUI\input'
TEST_IMAGE = os.path.join(INPUT_DIR, 'edit_image (7).png')


def login(session):
    r = session.post(BASE + '/login', json={'username': 'admin', 'password': 'password'})
    assert r.status_code == 200, f'login failed: {r.status_code} {r.text}'
    print('登录成功')


def submit(session, **form):
    """提交生成任务,返回 task_id"""
    files = {'f': (None, 'x')}  # 强制 multipart
    if 'image' in form and form['image']:
        files['image'] = ('first_frame.png', open(form['image'], 'rb'), 'image/png')
        del form['image']
    r = session.post(BASE + '/generate', data=form, files=files)
    assert r.status_code == 200, f'提交失败: {r.status_code} {r.text}'
    data = r.json()
    assert 'task_id' in data, f'无 task_id: {data}'
    print(f'提交成功, task_id: {data["task_id"]}, 表单: {form}')
    return data['task_id']


def wait_status(session, task_id, seconds):
    """等待指定秒数后返回任务状态"""
    time.sleep(seconds)
    r = session.get(BASE + f'/api/task/{task_id}')
    assert r.status_code == 200, f'查询失败: {r.status_code} {r.text}'
    return r.json()


def poll_until_done(session, task_id, timeout=900):
    start = time.time()
    while time.time() - start < timeout:
        task = wait_status(session, task_id, 15)
        if task['status'] in ('done', 'error'):
            return task
    raise TimeoutError('任务超时')


def main():
    s = requests.Session()
    login(s)

    # 测试1: I2V 不传比例
    print('\n=== 测试1: I2V 带图不传比例 ===')
    assert os.path.exists(TEST_IMAGE), f'测试图片不存在: {TEST_IMAGE}'
    tid = submit(s, model='minimax_h3_i2v_turbo', prompt='镜头缓缓推进', seed='1111', image=TEST_IMAGE)
    # 先等 30 秒确认进入 running(而非立即 error)
    task = wait_status(s, tid, 30)
    print(f'30s 后状态: {task["status"]}, error: {task["error"]}')
    assert task['status'] == 'running', f'I2V 任务应进入 running,实际 {task["status"]}: {task["error"]}'
    print('注入无误(无比例键也不报错) ✓')

    # 测试2: T2V 带比例
    print('\n=== 测试2: T2V 带比例(应继续注入) ===')
    tid2 = submit(s, model='minimax_h3_t2v_turbo', prompt='航拍城市夜景', aspect_ratio='16:9 (Widescreen)', duration='5', seed='2222')
    task2 = wait_status(s, tid2, 30)
    print(f'30s 后状态: {task2["status"]}, error: {task2["error"]}')
    assert task2['status'] == 'running', f'T2V 任务应进入 running,实际 {task2["status"]}: {task2["error"]}'
    print('T2V 比例注入正常 ✓')

    # 等待两个任务完成
    print('\n等待任务完成...')
    r1 = poll_until_done(s, tid)
    print(f'I2V 最终: {r1["status"]}, 结果: {r1["result"]}')
    assert r1['status'] == 'done' and 'video_url' in r1['result'], f'I2V 失败: {r1}'
    print('测试1 通过 ✓')

    r2 = poll_until_done(s, tid2)
    print(f'T2V 最终: {r2["status"]}, 结果: {r2["result"]}')
    assert r2['status'] == 'done' and 'video_url' in r2['result'], f'T2V 失败: {r2}'
    print('测试2 通过 ✓')

    print('\n=== 全部通过 ===')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    main()
