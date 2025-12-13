"""
Comfimage 服务启动脚本
"""

import argparse
import os
import sys

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, project_root)


def main():
    """主函数：解析参数并启动应用"""
    parser = argparse.ArgumentParser(description='启动Comfimage服务')
    parser.add_argument('--base_url', default='', help='基础URL路径（nginx location路径），默认为空')
    args = parser.parse_args()

    # 设置环境变量，必须在导入app之前设置
    os.environ['BASE_PATH'] = args.base_url

    # 在设置环境变量后导入app
    from src.app import app

    app.run(host='127.0.0.1', port=5000, debug=False)


if __name__ == '__main__':
    main()
