# -*- coding: utf-8 -*-
"""
视频任务异步验证:
1. 提交 T2V,确认立即返回 task_id
2. 模拟"手机切后台/刷新":提交后新开一个 session 查询(等价于用户回来重新连上)
3. 轮询直到 done,确认拿到 video_url
"""
import sys
import time

import requests

BASE = 'http://127.0.0.1:5000'


def main():
    s = requests.Session()
    r = s.post(BASE + '/login', json={'username': 'admin', 'password': 'password'})
    assert r.status_code == 200
    print('登录成功')

    t0 = time.time()
    r = s.post(BASE + '/generate', data={
        'model': 'minimax_h3_t2v_turbo',
        'prompt': '测试异步视频:湖畔日落',
        'aspect_ratio': '9:16 (Portrait Widescreen)',
        'duration': '5',
        'seed': '7777'
    }, files={'f': (None, 'x')})
    submit_elapsed = time.time() - t0
    assert r.status_code == 200, f'提交失败: {r.status_code} {r.text}'
    data = r.json()
    assert 'task_id' in data
    print(f'提交返回 task_id（耗时 {submit_elapsed:.1f}s，未阻塞）: {data}')

    task_id = data['task_id']

    # 模拟"切后台/刷新"：弃用原 session，新 session 查询（等价于用户回到页面重新轮询）
    s2 = requests.Session()
    r = s2.post(BASE + '/login', json={'username': 'admin', 'password': 'password'})
    assert r.status_code == 200
    print('已模拟刷新页面（新 session 轮询）\n')

    start = time.time()
    while True:
        r = s2.get(BASE + f'/api/task/{task_id}')
        assert r.status_code == 200, f'查询失败: {r.status_code} {r.text}'
        task = r.json()
        elapsed = time.time() - start
        if task['status'] in ('done', 'error'):
            print(f'[{elapsed:.0f}s] 最终状态: {task["status"]}, 结果: {task["result"]}')
            break
        print(f'[{elapsed:.0f}s] 状态: {task["status"]}')
        if elapsed > 900:
            raise TimeoutError('视频任务超时')
        time.sleep(10)

    assert task['status'] == 'done' and 'video_url' in task['result']
    assert task['result']['seed'] == 7777, f'种子注入错误: {task["result"]}'
    print('\n视频异步验证通过 ✓')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    main()
